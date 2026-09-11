"""
Pytest tests for Phase 6B: Admin/MoSPI Outcome Analytics Backend Endpoints.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.models.models import Officer, Role, CompetencyScore
from app.seed import seed_database


@pytest.fixture(scope="module")
def test_db_session():
    """In-memory SQLite DB populated with seed data."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    seed_database(session=session)
    yield session
    session.close()


@pytest.fixture(scope="module")
def client(test_db_session):
    """FastAPI TestClient with DB dependency override."""
    def _override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestAdminGapSummary:
    def test_gap_summary_with_fallback_and_evidence(self, client, test_db_session):
        """
        Seed 2 officers with different current levels for the same competency.
        Officer 1 has a CompetencyScore record (evidence-based).
        Officer 2 has NO CompetencyScore record for that competency, so it falls back to static profile level.
        Assert avg_current_level and avg_gap compute correctly and officer 2 is included.
        """
        role = test_db_session.query(Role).filter(Role.role_id == "R001").first()
        if not role:
            role = Role(role_id="R001", role_title="JSO", expected_skills={"Industrial Statistics": 4})
            test_db_session.add(role)
            test_db_session.commit()

        off1 = Officer(
            officer_id="TEST_ADMIN_OFF1",
            name="Admin Off 1",
            designation="JSO",
            department="Test Admin Dept",
            role_id="R001",
            experience_years=3,
            qualification="B.Sc",
            past_trainings=[],
            current_skills={"Industrial Statistics": 1},
        )
        off2 = Officer(
            officer_id="TEST_ADMIN_OFF2",
            name="Admin Off 2",
            designation="JSO",
            department="Test Admin Dept",
            role_id="R001",
            experience_years=5,
            qualification="M.Sc",
            past_trainings=[],
            current_skills={"Industrial Statistics": 2},  # profile fallback = 2.0
        )
        test_db_session.add_all([off1, off2])
        test_db_session.commit()

        score1 = CompetencyScore(
            officer_id="TEST_ADMIN_OFF1",
            cid="CID-D-107",
            skill_label="Industrial Statistics",
            quiz_score=75.0,
            artifact_score=None,
            combined_score=3.0,
            confidence_level="low (1 source)",
            source="baseline_quiz",
            recorded_on="2026-01-01",
        )
        test_db_session.add(score1)
        test_db_session.commit()

        res = client.get("/api/admin/gap-summary?department=Test Admin Dept")
        assert res.status_code == 200
        data = res.json()

        assert "note" in data
        assert "items" in data
        items = data["items"]

        ind_item = next((item for item in items if item["skill_label"] == "Industrial Statistics"), None)
        assert ind_item is not None
        assert ind_item["officer_count"] == 2
        assert ind_item["avg_current_level"] == 2.5
        assert ind_item["avg_required_level"] == 4.0
        assert ind_item["avg_gap"] == 1.5
        assert ind_item["officers_below_required"] == 2


class TestAdminTrainingEffectiveness:
    def test_training_effectiveness_reassess_filtering(self, client, test_db_session):
        """
        Seed one officer with 2 scores for a competency (improved),
        and one officer with 1 score for the same competency.
        Assert officers_reassessed == 1 and single-score officer is excluded from training effectiveness.
        """
        cid = "CID-TEST-EFFECTIVE"
        label = "Test Analytics Skill"

        score1_off1 = CompetencyScore(
            officer_id="TEST_REASSESS_OFF1",
            cid=cid,
            skill_label=label,
            quiz_score=50.0,
            combined_score=2.0,
            confidence_level="low (1 source)",
            source="baseline_quiz",
            recorded_on="2026-01-01",
        )
        score2_off1 = CompetencyScore(
            officer_id="TEST_REASSESS_OFF1",
            cid=cid,
            skill_label=label,
            quiz_score=85.0,
            combined_score=3.5,
            confidence_level="low (1 source)",
            source="quiz_after_course",
            recorded_on="2026-02-01",
        )

        score1_off2 = CompetencyScore(
            officer_id="TEST_SINGLE_OFF2",
            cid=cid,
            skill_label=label,
            quiz_score=60.0,
            combined_score=2.5,
            confidence_level="low (1 source)",
            source="baseline_quiz",
            recorded_on="2026-01-01",
        )

        test_db_session.add_all([score1_off1, score2_off1, score1_off2])
        test_db_session.commit()

        res = client.get("/api/admin/training-effectiveness")
        assert res.status_code == 200
        data = res.json()

        assert "note" in data
        items = data["items"]

        test_item = next((i for i in items if i["cid"] == cid), None)
        assert test_item is not None
        assert test_item["officers_reassessed"] == 1
        assert test_item["improved_count"] == 1
        assert test_item["declined_count"] == 0
        assert test_item["avg_improvement"] == 1.5


class TestAdminNoteDisclosure:
    def test_all_endpoints_contain_note(self, client):
        """Verify top-level 'note' field is present in all three admin endpoints."""
        expected_note = (
            "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), "
            "with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
        )

        res1 = client.get("/api/admin/gap-summary")
        assert res1.status_code == 200
        assert res1.json().get("note") == expected_note

        res2 = client.get("/api/admin/training-effectiveness")
        assert res2.status_code == 200
        assert res2.json().get("note") == expected_note

        res3 = client.get("/api/admin/department-summary")
        assert res3.status_code == 200
        assert res3.json().get("note") == expected_note
