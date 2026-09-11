"""
Seed script — populates the SQLite database from the seed_data/ files.

Idempotent: checks whether data already exists before inserting.
Run with:  python -m app.seed
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path

from app.db import engine, SessionLocal, Base
from app.models.models import (
    Officer,
    Role,
    CourseCatalogue,
    Enrollment,
    CompetencyDictionary,
    CompetencyScore,
    QuizAttempt,
    QuizAttemptGenerated,
    QuizAttemptQuestion,
    AdminOutcomeSummary,
)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"


def _get_seed_path(filename: str) -> Path:
    """Return Path to seed file in SEED_DIR or project root."""
    p = SEED_DIR / filename
    if p.exists():
        return p
    root_p = SEED_DIR.parent / filename
    if root_p.exists():
        return root_p
    raise FileNotFoundError(f"Seed file '{filename}' not found in '{SEED_DIR}' or project root.")


def _seed_roles(session) -> None:
    """Load roles from skill_framework.json."""
    filepath = _get_seed_path("skill_framework.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))
    for role_dict in data["roles"]:
        if session.query(Role).filter_by(role_id=role_dict["role_id"]).first() is None:
            session.add(
                Role(
                    role_id=role_dict["role_id"],
                    role_title=role_dict["role_title"],
                    expected_skills=role_dict["expected_skills"],
                )
            )


def _seed_officers(session) -> None:
    """Load officers from officer_profiles.json."""
    filepath = _get_seed_path("officer_profiles.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))
    for o in data["officers"]:
        if session.query(Officer).filter_by(officer_id=o["officer_id"]).first() is None:
            session.add(
                Officer(
                    officer_id=o["officer_id"],
                    name=o["name"],
                    designation=o["designation"],
                    role_id=o["role_id"],
                    department=o["department"],
                    experience_years=o["experience_years"],
                    qualification=o["qualification"],
                    past_trainings=o.get("past_trainings", []),
                    current_skills=o.get("current_skills", {}),
                )
            )


def _seed_courses(session) -> None:
    """Load courses from course_catalogue.csv."""
    filepath = _get_seed_path("course_catalogue.csv")
    with filepath.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if session.query(CourseCatalogue).filter_by(course_id=row["course_id"]).first() is None:
                raw_tags = row.get("skill_tags", "")
                tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
                session.add(
                    CourseCatalogue(
                        course_id=row["course_id"],
                        course_title=row["course_title"],
                        category=row["category"],
                        skill_tags=tags,
                        duration_hours=int(row["duration_hours"]),
                        level=row["level"],
                        source=row["source"],
                    )
                )


def _seed_enrollments(session) -> None:
    """Load enrollments from enrollment_status.csv."""
    filepath = _get_seed_path("enrollment_status.csv")
    with filepath.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if session.query(Enrollment).filter_by(enrollment_id=row["enrollment_id"]).first() is None:
                progress = row.get("progress_percent", "0")
                progress_val = float(progress) if progress else 0.0
                completion = row.get("completion_date", "") or None

                session.add(
                    Enrollment(
                        enrollment_id=row["enrollment_id"],
                        officer_id=row["officer_id"],
                        course_id=row["course_id"],
                        course_title=row["course_title"],
                        status=row["status"],
                        enrolled_date=row.get("enrolled_date", None),
                        progress_percent=progress_val,
                        completion_date=completion,
                    )
                )


def _seed_competency_dictionary(session) -> None:
    """Load FRAC competency dictionary from frac_competency_dictionary.json."""
    filepath = _get_seed_path("frac_competency_dictionary.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))
    for comp in data.get("competencies", []):
        cid = comp["cid"]
        if session.query(CompetencyDictionary).filter_by(cid=cid).first() is None:
            session.add(
                CompetencyDictionary(
                    cid=cid,
                    label=comp["label"],
                    type=comp["type"],
                    level_descriptions=comp["level_descriptions"],
                )
            )


def _seed_quiz_attempts(session) -> None:
    """Load quiz attempts from quiz_attempts_seed.json."""
    filepath = _get_seed_path("quiz_attempts_seed.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))
    for att in data.get("attempts", []):
        attempt_id = att["attempt_id"]
        if session.query(QuizAttempt).filter_by(attempt_id=attempt_id).first() is None:
            quiz_attempt = QuizAttempt(
                attempt_id=attempt_id,
                officer_id=att["officer_id"],
                course_id=att.get("course_id"),
                quiz_source_material=att["quiz_source_material"],
                attempted_on=att["attempted_on"],
                raw_score_percent=att["raw_score_percent"],
            )
            session.add(quiz_attempt)
            for q in att.get("questions", []):
                session.add(
                    QuizAttemptQuestion(
                        attempt_id=attempt_id,
                        competency_tag=q["competency_tag"],
                        skill_label=q["skill_label"],
                        is_correct=q["is_correct"],
                    )
                )


def _seed_competency_history(session) -> None:
    """Load competency score history from competency_history_seed.json."""
    filepath = _get_seed_path("competency_history_seed.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))

    for item in data.get("history", []):
        officer_id = item["officer_id"]
        skill_label = item["skill_label"]
        cid = item["cid"]

        for rec in item.get("records", []):
            recorded_on = rec["recorded_on"]
            source = rec["source"]

            # Idempotency natural key check on officer_id + cid + recorded_on + source
            existing = (
                session.query(CompetencyScore)
                .filter_by(
                    officer_id=officer_id,
                    cid=cid,
                    recorded_on=recorded_on,
                    source=source,
                )
                .first()
            )

            if existing is None:
                quiz_score = rec.get("quiz_score")
                artifact_score = rec.get("artifact_score")
                combined_score = rec.get("combined_score")
                if combined_score is None:
                    if artifact_score is not None and quiz_score is not None:
                        combined_score = round(0.6 * quiz_score + 0.4 * artifact_score, 2)
                    else:
                        combined_score = quiz_score if quiz_score is not None else 0.0

                confidence_level = rec.get("confidence_level")
                if confidence_level is None:
                    confidence_level = (
                        "medium (2 sources)"
                        if (quiz_score is not None and artifact_score is not None)
                        else "low (1 source)"
                    )

                session.add(
                    CompetencyScore(
                        officer_id=officer_id,
                        cid=cid,
                        skill_label=skill_label,
                        quiz_score=quiz_score,
                        artifact_score=artifact_score,
                        combined_score=combined_score,
                        confidence_level=confidence_level,
                        source=source,
                        recorded_on=recorded_on,
                        artifact_reference=rec.get("artifact_reference"),
                    )
                )

    if "admin_outcome_summary" in data:
        if session.query(AdminOutcomeSummary).first() is None:
            session.add(
                AdminOutcomeSummary(
                    summary_data=data["admin_outcome_summary"]
                )
            )


def seed_database(session=None) -> None:
    """Create all tables and populate with seed data (idempotent)."""
    Base.metadata.create_all(bind=engine)

    close_session = False
    if session is None:
        session = SessionLocal()
        close_session = True

    try:
        print("Seeding database ...")
        # Order matters for foreign key dependencies
        _seed_roles(session)
        _seed_officers(session)
        _seed_courses(session)
        _seed_enrollments(session)
        _seed_competency_dictionary(session)
        _seed_quiz_attempts(session)
        _seed_competency_history(session)
        session.commit()

        score_count = session.query(CompetencyScore).count()
        attempt_count = session.query(QuizAttempt).count()
        print(f"[OK] Database seeded successfully. CompetencyScore rows: {score_count}, QuizAttempt rows: {attempt_count}.")
    except Exception:
        session.rollback()
        raise
    finally:
        if close_session:
            session.close()


if __name__ == "__main__":
    seed_database()

