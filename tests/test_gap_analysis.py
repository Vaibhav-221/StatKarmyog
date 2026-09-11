"""
Pytest tests for the gap_analysis service layer.

Tests the pure business-logic functions against real seed data using
two officers: OFF001 (R01, JSO) and OFF003 (R03, ISS Officer).
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models.models import Officer, Role, CourseCatalogue
from app.seed import (
    _seed_roles,
    _seed_officers,
    _seed_courses,
    _seed_enrollments,
)
from app.services.gap_analysis import compute_skill_gaps, recommend_courses


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def db_session():
    """
    Create an in-memory SQLite database seeded with the real seed_data/ files,
    shared across all tests in this module for speed.
    """
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed in order (FK dependencies)
    _seed_roles(session)
    _seed_officers(session)
    _seed_courses(session)
    _seed_enrollments(session)
    session.commit()

    yield session
    session.close()


# ── OFF001: Rakesh Kumar — JSO Industrial Statistics (R01) ────────────────

class TestOFF001Gaps:
    """
    OFF001 current_skills vs R01 expected_skills:

    Expected (R01):
        Survey Design:3, Sampling:2, Industrial Statistics:4, Data Quality Frameworks:2,
        Python:2, SQL:2, Data Visualization:3, Data Privacy:2, Communication:3, Ethics:3

    Current (OFF001):
        Survey Design:2, Sampling:2, Industrial Statistics:3, Data Quality Frameworks:1,
        Python:1, SQL:2, Data Visualization:1, Data Privacy:1, Communication:3, Ethics:3

    Gaps (current < expected):
        Survey Design:       2 vs 3 → gap 1
        Industrial Statistics:3 vs 4 → gap 1
        Data Quality Frameworks:1 vs 2 → gap 1
        Python:              1 vs 2 → gap 1
        Data Visualization:  1 vs 3 → gap 2
        Data Privacy:        1 vs 2 → gap 1
    """

    def test_gap_count(self, db_session):
        result = compute_skill_gaps(db_session, "OFF001")
        assert result is not None
        assert result["officer_id"] == "OFF001"
        assert result["role_id"] == "R01"
        assert len(result["gaps"]) == 6

    def test_exact_gap_values(self, db_session):
        result = compute_skill_gaps(db_session, "OFF001")
        gaps = {g["skill"]: g for g in result["gaps"]}

        assert gaps["Data Visualization"]["gap_size"] == 2
        assert gaps["Data Visualization"]["current_level"] == 1
        assert gaps["Data Visualization"]["expected_level"] == 3

        assert gaps["Survey Design"]["gap_size"] == 1
        assert gaps["Python"]["gap_size"] == 1
        assert gaps["Data Privacy"]["gap_size"] == 1
        assert gaps["Industrial Statistics"]["gap_size"] == 1
        assert gaps["Data Quality Frameworks"]["gap_size"] == 1

    def test_sorted_by_gap_descending(self, db_session):
        result = compute_skill_gaps(db_session, "OFF001")
        gaps = result["gaps"]
        # Data Visualization (gap 2) should come first
        assert gaps[0]["skill"] == "Data Visualization"
        assert gaps[0]["gap_size"] == 2
        # All remaining gaps should be 1
        for g in gaps[1:]:
            assert g["gap_size"] == 1

    def test_no_false_positives(self, db_session):
        """Skills where current >= expected should NOT appear."""
        result = compute_skill_gaps(db_session, "OFF001")
        gap_skills = {g["skill"] for g in result["gaps"]}
        # Sampling (2 vs 2), SQL (2 vs 2), Communication (3 vs 3), Ethics (3 vs 3)
        assert "Sampling" not in gap_skills
        assert "SQL" not in gap_skills
        assert "Communication" not in gap_skills
        assert "Ethics" not in gap_skills


# ── OFF003: Arjun Nair — ISS Officer Labour Statistics (R03) ──────────────

class TestOFF003Gaps:
    """
    Expected (R03):
        Labour Statistics:4, Survey Design:4, SDG Indicators:3, Data Quality Frameworks:3,
        Python:3, SQL:3, AI/ML:2, GIS:2, Government Cloud:2, Cybersecurity:2,
        Leadership:3, Decision Making:3, Change Management:2

    Current (OFF003):
        Labour Statistics:4, Survey Design:3, SDG Indicators:2, Data Quality Frameworks:2,
        Python:2, SQL:3, AI/ML:1, GIS:1, Government Cloud:1, Cybersecurity:1,
        Leadership:3, Decision Making:3, Change Management:2

    Gaps:
        Survey Design:       3 vs 4 → gap 1
        SDG Indicators:      2 vs 3 → gap 1
        Data Quality Frameworks:2 vs 3 → gap 1
        Python:              2 vs 3 → gap 1
        AI/ML:               1 vs 2 → gap 1
        GIS:                 1 vs 2 → gap 1
        Government Cloud:    1 vs 2 → gap 1
        Cybersecurity:       1 vs 2 → gap 1
    """

    def test_gap_count(self, db_session):
        result = compute_skill_gaps(db_session, "OFF003")
        assert result is not None
        assert result["officer_id"] == "OFF003"
        assert result["role_id"] == "R03"
        assert len(result["gaps"]) == 8

    def test_exact_gap_values(self, db_session):
        result = compute_skill_gaps(db_session, "OFF003")
        gaps = {g["skill"]: g for g in result["gaps"]}

        assert gaps["Survey Design"]["gap_size"] == 1
        assert gaps["SDG Indicators"]["gap_size"] == 1
        assert gaps["AI/ML"]["gap_size"] == 1
        assert gaps["GIS"]["gap_size"] == 1
        assert gaps["Cybersecurity"]["current_level"] == 1
        assert gaps["Cybersecurity"]["expected_level"] == 2
        assert gaps["Government Cloud"]["current_level"] == 1
        assert gaps["Government Cloud"]["expected_level"] == 2

    def test_no_false_positives(self, db_session):
        result = compute_skill_gaps(db_session, "OFF003")
        gap_skills = {g["skill"] for g in result["gaps"]}
        # These are at or above expected
        assert "Labour Statistics" not in gap_skills  # 4 vs 4
        assert "SQL" not in gap_skills                # 3 vs 3
        assert "Leadership" not in gap_skills         # 3 vs 3
        assert "Decision Making" not in gap_skills    # 3 vs 3
        assert "Change Management" not in gap_skills  # 2 vs 2


# ── Recommendations ──────────────────────────────────────────────────────────

class TestRecommendations:
    """Verify that recommendations only include courses with actual skill overlap."""

    def test_off001_recommendations_have_overlap(self, db_session):
        """Every recommended course must have ≥ 1 matched gap skill."""
        result = compute_skill_gaps(db_session, "OFF001")
        gap_skills = {g["skill"] for g in result["gaps"]}

        recs = recommend_courses(db_session, "OFF001", top_n=10)
        assert recs is not None
        assert len(recs) > 0

        for rec in recs:
            matched = set(rec["matched_skills"])
            assert matched.issubset(gap_skills), (
                f"Course {rec['course_id']} matched {matched} "
                f"but gap skills are {gap_skills}"
            )
            assert rec["score"] == len(matched)
            assert rec["score"] >= 1

    def test_off003_recommendations_have_overlap(self, db_session):
        recs = recommend_courses(db_session, "OFF003", top_n=10)
        result = compute_skill_gaps(db_session, "OFF003")
        gap_skills = {g["skill"] for g in result["gaps"]}

        assert recs is not None
        assert len(recs) > 0

        for rec in recs:
            matched = set(rec["matched_skills"])
            assert matched.issubset(gap_skills)
            assert rec["score"] >= 1

    def test_top_n_limits_results(self, db_session):
        recs = recommend_courses(db_session, "OFF001", top_n=3)
        assert recs is not None
        assert len(recs) <= 3

    def test_recommendations_sorted_by_score(self, db_session):
        recs = recommend_courses(db_session, "OFF001", top_n=20)
        assert recs is not None
        scores = [r["score"] for r in recs]
        assert scores == sorted(scores, reverse=True)


# ── Edge Cases ───────────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_unknown_officer_returns_none(self, db_session):
        assert compute_skill_gaps(db_session, "OFF999") is None
        assert recommend_courses(db_session, "OFF999") is None

    def test_all_six_officers_have_results(self, db_session):
        for oid in ["OFF001", "OFF002", "OFF003", "OFF004", "OFF005", "OFF006"]:
            result = compute_skill_gaps(db_session, oid)
            assert result is not None, f"Gap analysis failed for {oid}"
            assert result["officer_id"] == oid
