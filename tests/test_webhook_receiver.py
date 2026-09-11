"""
Tests for the LMS-side webhook receiver endpoint: POST /webhooks/igot-status.

Uses an in-memory SQLite database and FastAPI's TestClient to verify that
incoming webhook payloads correctly create and update Enrollment rows.

NOTE: We build a minimal FastAPI app for testing (no lifespan, no chromadb)
to avoid import-time side effects from the full app.main module.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session

from app.db import Base, get_db
from app.models.models import Officer, Role, Enrollment
from app.routers.webhooks import router as webhook_router


# ── Test database setup ─────────────────────────────────────────────────────

_TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_TEST_ENGINE)


def _override_get_db():
    """Yield a test database session."""
    db = _TestSession()
    try:
        yield db
    finally:
        db.close()


# Build a minimal FastAPI app with just the webhook router — no lifespan,
# no chromadb, no seed. This avoids the heavy startup of app.main.
_webhook_app = FastAPI()
_webhook_app.include_router(webhook_router)
_webhook_app.dependency_overrides[get_db] = _override_get_db


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables and seed minimal data before each test, drop after."""
    Base.metadata.create_all(bind=_TEST_ENGINE)

    # Seed minimal role and officer so FK constraints are satisfied
    session = _TestSession()
    session.add(Role(role_id="R01", role_title="Test Role", expected_skills={}))
    session.add(
        Officer(
            officer_id="OFF001",
            name="Test Officer",
            designation="JSO",
            role_id="R01",
            department="Statistics",
            experience_years=5,
            qualification="MSc",
            past_trainings=[],
            current_skills={},
        )
    )
    session.commit()
    session.close()

    yield

    Base.metadata.drop_all(bind=_TEST_ENGINE)


@pytest.fixture
def client():
    """FastAPI test client using the minimal webhook app."""
    return TestClient(_webhook_app)


# ── Tests ────────────────────────────────────────────────────────────────────

def test_webhook_creates_enrollment(client):
    """
    POST a webhook payload for a course the officer is NOT yet enrolled in.
    Assert that a new Enrollment row is created with the correct fields.
    """
    payload = {
        "officer_id": "OFF001",
        "course_id": "C099",
        "course_title": "Brand New Course",
        "status": "In-Progress",
        "progress_percent": 25.0,
        "enrolled_date": "2026-09-07",
        "completion_date": None,
        "event_timestamp": "2026-09-07T10:00:00Z",
    }

    resp = client.post("/webhooks/igot-status", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"received": True}

    # Verify the enrollment was created in the DB
    session = _TestSession()
    enrollment = (
        session.query(Enrollment)
        .filter(
            Enrollment.officer_id == "OFF001",
            Enrollment.course_id == "C099",
        )
        .first()
    )
    assert enrollment is not None
    assert enrollment.status == "In-Progress"
    assert enrollment.progress_percent == 25.0
    assert enrollment.course_title == "Brand New Course"
    assert enrollment.enrolled_date == "2026-09-07"
    assert enrollment.completion_date is None
    session.close()


def test_webhook_updates_existing_enrollment(client):
    """
    POST a webhook payload for a course the officer IS already enrolled in.
    Assert that the existing row is updated (not duplicated).
    """
    # First, create an enrollment via webhook
    payload_v1 = {
        "officer_id": "OFF001",
        "course_id": "C100",
        "course_title": "Existing Course",
        "status": "Enrolled",
        "progress_percent": 0.0,
        "enrolled_date": "2026-09-01",
        "completion_date": None,
        "event_timestamp": "2026-09-01T10:00:00Z",
    }
    resp1 = client.post("/webhooks/igot-status", json=payload_v1)
    assert resp1.status_code == 200

    # Now update it
    payload_v2 = {
        "officer_id": "OFF001",
        "course_id": "C100",
        "course_title": "Existing Course",
        "status": "In-Progress",
        "progress_percent": 45.0,
        "enrolled_date": "2026-09-01",
        "completion_date": None,
        "event_timestamp": "2026-09-05T10:00:00Z",
    }
    resp2 = client.post("/webhooks/igot-status", json=payload_v2)
    assert resp2.status_code == 200

    # Verify only ONE enrollment exists for (OFF001, C100)
    session = _TestSession()
    enrollments = (
        session.query(Enrollment)
        .filter(
            Enrollment.officer_id == "OFF001",
            Enrollment.course_id == "C100",
        )
        .all()
    )
    assert len(enrollments) == 1

    enrollment = enrollments[0]
    assert enrollment.status == "In-Progress"
    assert enrollment.progress_percent == 45.0
    session.close()


def test_webhook_completion_sets_date(client):
    """
    POST a Completed webhook payload and verify completion_date is stored.
    """
    payload = {
        "officer_id": "OFF001",
        "course_id": "C101",
        "course_title": "Completed Course",
        "status": "Completed",
        "progress_percent": 100.0,
        "enrolled_date": "2026-08-01",
        "completion_date": "2026-09-07",
        "event_timestamp": "2026-09-07T12:00:00Z",
    }

    resp = client.post("/webhooks/igot-status", json=payload)
    assert resp.status_code == 200

    session = _TestSession()
    enrollment = (
        session.query(Enrollment)
        .filter(
            Enrollment.officer_id == "OFF001",
            Enrollment.course_id == "C101",
        )
        .first()
    )
    assert enrollment is not None
    assert enrollment.status == "Completed"
    assert enrollment.progress_percent == 100.0
    assert enrollment.completion_date == "2026-09-07"
    session.close()
