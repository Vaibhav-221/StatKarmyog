from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.seed import (
    _seed_competency_dictionary,
    _seed_courses,
    _seed_officers,
    _seed_roles,
    _seed_work_artifacts,
)
from app.services.work_artifacts import (
    get_artifact_gaps,
    get_artifact_recommendations,
    get_officer_artifacts,
)


def _seed_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    _seed_roles(session)
    _seed_officers(session)
    _seed_courses(session)
    _seed_competency_dictionary(session)
    _seed_work_artifacts(session)
    session.commit()
    return session


def test_officer_gets_role_relevant_artifacts_only():
    session = _seed_session()
    try:
        artifacts = get_officer_artifacts(session, "OFF001")
        assert artifacts
        assert len(artifacts) < 15
        assert all("artifact_id" in item for item in artifacts)
        assert any(item["artifact_id"] == "WA-2025-015" for item in artifacts)
    finally:
        session.close()


def test_artifact_gaps_are_calculated_from_database_levels():
    session = _seed_session()
    try:
        gaps = get_artifact_gaps(session, "OFF001")
        assert gaps
        top_gap = gaps[0]
        assert top_gap["required_percent"] >= top_gap["current_percent"]
        assert top_gap["gap"] == round(top_gap["required_percent"] - top_gap["current_percent"], 1)
        assert top_gap["gap_status"] in {"Low/No Gap", "Moderate Gap", "High Gap", "Critical Gap"}
    finally:
        session.close()


def test_artifact_recommendations_are_explainable_and_course_backed():
    session = _seed_session()
    try:
        recs = get_artifact_recommendations(session, "OFF001")
        assert recs
        assert recs[0]["course_id"].startswith("C")
        assert recs[0]["matched_skills"]
        assert "assigned work artifact" in recs[0]["reason"]
    finally:
        session.close()
