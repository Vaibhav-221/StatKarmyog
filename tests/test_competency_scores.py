"""
Pytest tests for Phase 1B: Evidence-based competency scoring and history.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.models.models import CompetencyScore, QuizAttempt, QuizAttemptQuestion, CompetencyDictionary
from app.seed import seed_database
from app.services.gap_analysis import compute_skill_gaps


@pytest.fixture(scope="module")
def test_db_session():
    """Create an in-memory SQLite database seeded with all seed data."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed all tables using seed_database with test session
    seed_database(session=session)

    yield session
    session.close()


@pytest.fixture(scope="module")
def client(test_db_session):
    """FastAPI TestClient with DB dependency overridden by test_db_session."""
    def _override_get_db():
        try:
            yield test_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestEvidenceBasedGapAnalysis:
    """Task 4 (a) & (b): Evidence-based gap calculation and profile fallback."""

    def test_evidence_based_score_used_when_present(self, test_db_session):
        """(a) gap-analysis returns evidence-based values when CompetencyScore exists."""
        # OFF001 + "Survey Design" has CompetencyScore seed data (latest combined_score 2.6 < 3 required)
        result = compute_skill_gaps(test_db_session, "OFF001")
        assert result is not None
        gaps_by_skill = {g["skill"]: g for g in result["gaps"]}

        assert "Survey Design" in gaps_by_skill
        survey_gap = gaps_by_skill["Survey Design"]
        assert survey_gap["current_level"] == 2.6
        assert survey_gap["score_source"] == "evidence-based"
        assert survey_gap["confidence_level"] == "medium (2 sources)"
        assert survey_gap["gap_size"] == 0.4

    def test_profile_fallback_used_when_no_competency_score(self, test_db_session):
        """(b) gap-analysis falls back to profile value when no CompetencyScore row exists."""
        # OFF001 + "Industrial Statistics" has no CompetencyScore row in seed data
        # Profile current_skills["Industrial Statistics"] = 3, expected = 4
        result = compute_skill_gaps(test_db_session, "OFF001")
        assert result is not None
        gaps_by_skill = {g["skill"]: g for g in result["gaps"]}

        assert "Industrial Statistics" in gaps_by_skill
        ind_gap = gaps_by_skill["Industrial Statistics"]
        assert ind_gap["current_level"] == 3.0
        assert ind_gap["score_source"] == "profile-fallback"
        assert ind_gap["confidence_level"] == "profile-only"
        assert ind_gap["gap_size"] == 1.0


class TestSeedLoaderIdempotency:
    """Task 4 (c): Seed loader idempotency test."""

    def test_seed_loader_is_idempotent(self, test_db_session):
        """(c) Running seed loader twice does not duplicate rows."""
        initial_scores = test_db_session.query(CompetencyScore).count()
        initial_attempts = test_db_session.query(QuizAttempt).count()
        initial_questions = test_db_session.query(QuizAttemptQuestion).count()
        initial_cids = test_db_session.query(CompetencyDictionary).count()

        # Run seed_database again on the same session
        seed_database(session=test_db_session)

        assert test_db_session.query(CompetencyScore).count() == initial_scores
        assert test_db_session.query(QuizAttempt).count() == initial_attempts
        assert test_db_session.query(QuizAttemptQuestion).count() == initial_questions
        assert test_db_session.query(CompetencyDictionary).count() == initial_cids


class TestCompetencyScoreHistoryEndpoint:
    """Task 4 (d): /competency-scores/{officer_id} endpoint test."""

    def test_get_competency_scores_returns_ordered_history(self, client):
        """(d) GET /competency-scores/{officer_id} returns full ordered history."""
        response = client.get("/api/competency-scores/OFF001")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 4  # OFF001 has 2 records for Python and 2 for Survey Design

        # Check recorded_on ascending order
        dates = [item["recorded_on"] for item in data]
        assert dates == sorted(dates)

        # Check top-level endpoint alias works
        alias_resp = client.get("/competency-scores/OFF001")
        assert alias_resp.status_code == 200
        assert alias_resp.json() == data

    def test_get_competency_scores_unknown_officer_404(self, client):
        response = client.get("/api/competency-scores/OFF999")
        assert response.status_code == 404
