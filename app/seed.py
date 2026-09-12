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
    WorkArtifact,
    ArtifactCompetency,
    OfficerArtifact,
)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"

ARTIFACT_COMPETENCY_ALIASES = {
    "data analysis & interpretation": "Data Visualization",
    "statistical analysis": "Survey Design",
    "statistical interpretation": "Data Visualization",
    "data interpretation": "Data Visualization",
    "statistical sampling": "Sampling",
    "sampling theory": "Sampling",
    "stratified sampling": "Sampling",
    "sample size determination": "Sampling",
    "survey methodology": "Survey Design",
    "survey design": "Survey Design",
    "data quality management": "Data Quality Frameworks",
    "data validation": "Data Quality Frameworks",
    "quality assurance": "Data Quality Frameworks",
    "data cleaning": "Data Quality Frameworks",
    "missing value treatment": "Data Quality Frameworks",
    "outlier detection": "Data Quality Frameworks",
    "index number methods": "Price Statistics",
    "economic statistics": "National Accounts",
    "estimation methods": "National Accounts",
    "spreadsheet analysis": "SQL",
    "python/pandas": "Python",
    "python": "Python",
    "sql": "SQL",
    "data visualization": "Data Visualization",
    "dashboard design": "Data Visualization",
    "requirements analysis": "Project Management",
    "communication": "Communication",
    "report writing": "Communication",
    "technical documentation": "Communication",
    "documentation": "Communication",
    "field inspection": "Survey Design",
    "survey operations": "Survey Design",
    "metadata management": "Metadata Standards",
    "data standards": "Metadata Standards",
    "statistical concepts": "Survey Design",
    "indicator analysis": "SDG Indicators",
    "data governance": "Open Data",
    "planning & coordination": "Project Management",
    "statistical confidentiality": "Data Privacy",
    "data security": "Cybersecurity",
    "risk management": "Decision Making",
    "time series analysis": "Industrial Statistics",
    "seasonal adjustment": "Industrial Statistics",
    "statistical modelling": "AI/ML",
    "methodology review": "Survey Design",
    "trend analysis": "Data Visualization",
    "automation": "APIs",
}


def _artifact_required_level(difficulty: str) -> float:
    """Map artifact difficulty to the existing 1-5 competency scale."""
    return {
        "beginner": 2.0,
        "intermediate": 4.0,
        "advanced": 5.0,
    }.get((difficulty or "").strip().lower(), 3.0)


def _resolve_competency_label(label: str, known_labels: set[str]) -> str:
    """Resolve dataset competency wording to an existing dictionary label."""
    normalized = (label or "").strip().lower()
    if label in known_labels:
        return label
    return ARTIFACT_COMPETENCY_ALIASES.get(normalized, label)


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


def _seed_work_artifacts(session) -> None:
    """Load fictional work artifact data and officer assignments."""
    filepath = _get_seed_path("work_artifacts_dataset.json")
    data = json.loads(filepath.read_text(encoding="utf-8"))
    comp_rows = session.query(CompetencyDictionary).all()
    label_to_cid = {row.label: row.cid for row in comp_rows}
    known_labels = set(label_to_cid.keys())

    for item in data:
        artifact = session.query(WorkArtifact).filter_by(artifact_id=item["artifact_id"]).first()
        if artifact is None:
            artifact = WorkArtifact(
                artifact_id=item["artifact_id"],
                title=item["title"],
                artifact_type=item["artifact_type"],
                role=item["role"],
                department=item["department"],
                domain=item["domain"],
                difficulty=item["difficulty"],
                status=item["status"],
                required_competencies=item.get("required_competencies", []),
                source_type=item["source_type"],
                rag_enabled=bool(item.get("rag_enabled", True)),
                quiz_enabled=bool(item.get("quiz_enabled", True)),
                description=item["description"],
                skills=item.get("skills", []),
            )
            session.add(artifact)
        else:
            artifact.title = item["title"]
            artifact.artifact_type = item["artifact_type"]
            artifact.role = item["role"]
            artifact.department = item["department"]
            artifact.domain = item["domain"]
            artifact.difficulty = item["difficulty"]
            artifact.status = item["status"]
            artifact.required_competencies = item.get("required_competencies", [])
            artifact.source_type = item["source_type"]
            artifact.rag_enabled = bool(item.get("rag_enabled", True))
            artifact.quiz_enabled = bool(item.get("quiz_enabled", True))
            artifact.description = item["description"]
            artifact.skills = item.get("skills", [])

        required_level = _artifact_required_level(item["difficulty"])
        for display_label in item.get("required_competencies", []):
            resolved_label = _resolve_competency_label(display_label, known_labels)
            cid = label_to_cid.get(resolved_label)
            if cid is None:
                continue
            existing = (
                session.query(ArtifactCompetency)
                .filter_by(
                    artifact_id=item["artifact_id"],
                    competency_id=cid,
                    display_label=display_label,
                )
                .first()
            )
            if existing is None:
                session.add(
                    ArtifactCompetency(
                        artifact_id=item["artifact_id"],
                        competency_id=cid,
                        competency_label=resolved_label,
                        display_label=display_label,
                        required_level=required_level,
                    )
                )
            else:
                existing.competency_label = resolved_label
                existing.required_level = required_level

    session.flush()
    _seed_officer_artifact_assignments(session)


def _seed_officer_artifact_assignments(session) -> None:
    """Assign artifacts to officers from role/department/competency overlap."""
    assigned_at = "2026-09-12"
    officers = session.query(Officer).all()
    artifacts = session.query(WorkArtifact).all()

    for officer in officers:
        if officer.officer_id.startswith("ADM"):
            continue

        role_skills = set((officer.role.expected_skills or {}).keys()) if officer.role else set()
        ranked = []
        for artifact in artifacts:
            comp_labels = {c.competency_label for c in artifact.competencies}
            score = len(role_skills & comp_labels)
            haystack = " ".join([
                artifact.role,
                artifact.department,
                artifact.domain,
                artifact.title,
            ]).lower()
            if officer.department.lower() in haystack:
                score += 3
            for skill in role_skills:
                if skill.lower().split()[0] in haystack:
                    score += 1
            if score > 0:
                ranked.append((score, artifact.artifact_id))

        ranked.sort(key=lambda item: (-item[0], item[1]))
        for _, artifact_id in ranked[:4]:
            exists = (
                session.query(OfficerArtifact)
                .filter_by(officer_id=officer.officer_id, artifact_id=artifact_id)
                .first()
            )
            if exists is None:
                artifact = session.query(WorkArtifact).filter_by(artifact_id=artifact_id).first()
                session.add(
                    OfficerArtifact(
                        officer_id=officer.officer_id,
                        artifact_id=artifact_id,
                        assigned_at=assigned_at,
                        status=artifact.status if artifact else "Assigned",
                    )
                )


def _ensure_lightweight_schema_upgrades() -> None:
    """Add nullable columns needed by newer code when an older SQLite DB exists."""
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.begin() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(quiz_attempts)").fetchall()
        columns = {row[1] for row in rows}
        if rows and "artifact_id" not in columns:
            conn.exec_driver_sql("ALTER TABLE quiz_attempts ADD COLUMN artifact_id VARCHAR")
        if rows and "target_competency" not in columns:
            conn.exec_driver_sql("ALTER TABLE quiz_attempts ADD COLUMN target_competency VARCHAR")


def seed_database(session=None) -> None:
    """Create all tables and populate with seed data (idempotent)."""
    Base.metadata.create_all(bind=engine)
    _ensure_lightweight_schema_upgrades()

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
        _seed_work_artifacts(session)
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

