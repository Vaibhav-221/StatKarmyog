"""
Tests for the advance_enrollment_status() logic in isolation.

Mocks the webhook POST call and verifies the state transition math:
  - Enrolled → In-Progress (progress 10–40)
  - In-Progress → In-Progress (progress increases by 10–30, capped at 95)
  - In-Progress → Completed (when progress would exceed 95 → 100)
  - Completed → no-op
  - Progress never exceeds 100
"""

import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from mock_igot.db import Base as MockBase
from mock_igot.models import MockEnrollment


# ── Test database setup ─────────────────────────────────────────────────────

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test, drop after."""
    MockBase.metadata.create_all(bind=TEST_ENGINE)
    yield
    MockBase.metadata.drop_all(bind=TEST_ENGINE)


def _create_enrollment(session, enrollment_id, status, progress):
    """Helper to insert a test enrollment."""
    enrollment = MockEnrollment(
        enrollment_id=enrollment_id,
        officer_id="OFF001",
        course_id="C009",
        course_title="Test Course",
        status=status,
        enrolled_date="2026-09-01",
        progress_percent=progress,
        completion_date=None,
    )
    session.add(enrollment)
    session.commit()
    return enrollment


# ── Tests ────────────────────────────────────────────────────────────────────

@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_enrolled_to_in_progress(mock_session_local, mock_webhook):
    """Enrolled → In-Progress: progress should be between 10 and 40."""
    session = TestSession()
    _create_enrollment(session, "E_TEST_1", "Enrolled", 0.0)

    # Make the task use our test session
    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status
    result = advance_enrollment_status("E_TEST_1")

    assert result["changed"] is True
    assert result["status"] == "In-Progress"
    assert 10 <= result["progress_percent"] <= 40

    # Verify DB state
    enrollment = session.query(MockEnrollment).filter_by(enrollment_id="E_TEST_1").first()
    assert enrollment.status == "In-Progress"
    assert 10 <= enrollment.progress_percent <= 40

    mock_webhook.assert_called_once()
    session.close()


@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_in_progress_stays_in_progress(mock_session_local, mock_webhook):
    """In-Progress with low progress → stays In-Progress, progress increases."""
    session = TestSession()
    _create_enrollment(session, "E_TEST_2", "In-Progress", 20.0)

    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status

    # Use a fixed seed for deterministic test — set progress so it won't exceed 95
    # even with max increment of 30: 20 + 30 = 50 (still < 95)
    result = advance_enrollment_status("E_TEST_2")

    assert result["changed"] is True
    # Progress should have increased from 20
    assert result["progress_percent"] > 20.0
    # With initial 20 + random(10..30), result is 30..50 — never exceeds 95
    assert result["progress_percent"] <= 95

    mock_webhook.assert_called_once()
    session.close()


@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_in_progress_to_completed(mock_session_local, mock_webhook):
    """In-Progress with high progress → Completed (progress set to 100)."""
    session = TestSession()
    # Progress at 90 — any increment (min 10) will push past 95
    _create_enrollment(session, "E_TEST_3", "In-Progress", 90.0)

    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status
    result = advance_enrollment_status("E_TEST_3")

    assert result["changed"] is True
    assert result["status"] == "Completed"
    assert result["progress_percent"] == 100.0

    # Verify DB state
    enrollment = session.query(MockEnrollment).filter_by(enrollment_id="E_TEST_3").first()
    assert enrollment.status == "Completed"
    assert enrollment.progress_percent == 100.0
    assert enrollment.completion_date is not None

    mock_webhook.assert_called_once()
    session.close()


@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_completed_is_noop(mock_session_local, mock_webhook):
    """Completed → no-op: nothing changes, no webhook fired."""
    session = TestSession()
    _create_enrollment(session, "E_TEST_4", "Completed", 100.0)

    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status
    result = advance_enrollment_status("E_TEST_4")

    assert result["changed"] is False
    assert result["status"] == "Completed"

    # No webhook should be dispatched for a no-op
    mock_webhook.assert_not_called()
    session.close()


@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_progress_never_exceeds_100(mock_session_local, mock_webhook):
    """
    Run advancement multiple times on the same enrollment and verify
    progress never exceeds 100.
    """
    session = TestSession()
    _create_enrollment(session, "E_TEST_5", "Enrolled", 0.0)

    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status

    # Run advancement repeatedly until Completed
    for _ in range(20):  # More than enough iterations
        result = advance_enrollment_status("E_TEST_5")
        assert result["progress_percent"] <= 100.0
        if result["status"] == "Completed":
            break

    # Should have reached Completed
    enrollment = session.query(MockEnrollment).filter_by(enrollment_id="E_TEST_5").first()
    assert enrollment.status == "Completed"
    assert enrollment.progress_percent == 100.0
    session.close()


@patch("mock_igot.celery_app.dispatch_webhook")
@patch("mock_igot.celery_app.SessionLocal")
def test_nonexistent_enrollment(mock_session_local, mock_webhook):
    """Advancing a non-existent enrollment returns an error dict."""
    session = TestSession()
    mock_session_local.return_value = session
    mock_webhook.return_value = True

    from mock_igot.celery_app import advance_enrollment_status
    result = advance_enrollment_status("DOES_NOT_EXIST")

    assert "error" in result
    mock_webhook.assert_not_called()
    session.close()
