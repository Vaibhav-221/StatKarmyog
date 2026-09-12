from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from app.models.models import (
    ArtifactCompetency,
    CompetencyScore,
    CourseCatalogue,
    Officer,
    OfficerArtifact,
    WorkArtifact,
)


def classify_gap(gap_percent: float) -> str:
    """Classify a percent gap using the Work Artifact rules."""
    if gap_percent <= 10:
        return "Low/No Gap"
    if gap_percent <= 25:
        return "Moderate Gap"
    if gap_percent <= 40:
        return "High Gap"
    return "Critical Gap"


def _latest_score(db: "Session", officer_id: str, competency_label: str) -> CompetencyScore | None:
    return (
        db.query(CompetencyScore)
        .filter(
            CompetencyScore.officer_id == officer_id,
            CompetencyScore.skill_label == competency_label,
        )
        .order_by(CompetencyScore.recorded_on.desc(), CompetencyScore.id.desc())
        .first()
    )


def _current_level(officer: Officer, latest: CompetencyScore | None, competency_label: str) -> tuple[float, str, str]:
    if latest is not None:
        return latest.combined_score, "evidence-based", latest.confidence_level
    return float((officer.current_skills or {}).get(competency_label, 0)), "profile-fallback", "profile-only"


def _percent(level: float) -> float:
    return round(max(0.0, min(5.0, float(level))) * 20, 1)


def _recommend_courses_for_competency(
    db: "Session",
    competency_label: str,
    artifact: WorkArtifact,
    current_percent: float,
    limit: int = 3,
) -> list[dict]:
    courses = db.query(CourseCatalogue).all()
    rows = []
    artifact_level = (artifact.difficulty or "").strip().lower()
    for course in courses:
        tags = set(course.skill_tags or [])
        if competency_label not in tags:
            continue
        level_bonus = 0.25 if artifact_level and course.level == artifact_level else 0
        score = 1.0 + level_bonus
        rows.append(
            {
                "course_id": course.course_id,
                "course_title": course.course_title,
                "matched_skills": [competency_label],
                "score": score,
                "duration_hours": course.duration_hours,
                "level": course.level,
                "reason": (
                    "Recommended because this competency is required by your assigned work artifact "
                    "and your current competency score is below the required level."
                ),
                "current_percent": current_percent,
            }
        )
    rows.sort(key=lambda item: (-item["score"], item["course_id"]))
    return rows[:limit]


def artifact_summary(artifact: WorkArtifact) -> dict:
    return {
        "artifact_id": artifact.artifact_id,
        "title": artifact.title,
        "artifact_type": artifact.artifact_type,
        "role": artifact.role,
        "department": artifact.department,
        "domain": artifact.domain,
        "difficulty": artifact.difficulty,
        "status": artifact.status,
        "required_competencies": artifact.required_competencies or [],
        "description": artifact.description,
        "skills": artifact.skills or [],
        "rag_enabled": bool(artifact.rag_enabled),
        "quiz_enabled": bool(artifact.quiz_enabled),
    }


def list_artifacts(db: "Session") -> list[dict]:
    return [artifact_summary(a) for a in db.query(WorkArtifact).order_by(WorkArtifact.artifact_id.asc()).all()]


def get_artifact(db: "Session", artifact_id: str) -> dict | None:
    artifact = db.query(WorkArtifact).filter_by(artifact_id=artifact_id).first()
    if artifact is None:
        return None
    payload = artifact_summary(artifact)
    payload["competencies"] = get_artifact_competencies(db, artifact_id)
    return payload


def get_officer_artifacts(db: "Session", officer_id: str) -> list[dict] | None:
    officer = db.query(Officer).filter_by(officer_id=officer_id).first()
    if officer is None:
        return None
    assignments = (
        db.query(OfficerArtifact)
        .filter_by(officer_id=officer_id)
        .order_by(OfficerArtifact.assigned_at.desc(), OfficerArtifact.id.asc())
        .all()
    )
    return [
        {
            **artifact_summary(item.artifact),
            "assignment_status": item.status,
            "assigned_at": item.assigned_at,
        }
        for item in assignments
        if item.artifact is not None
    ]


def get_artifact_competencies(db: "Session", artifact_id: str) -> list[dict] | None:
    artifact = db.query(WorkArtifact).filter_by(artifact_id=artifact_id).first()
    if artifact is None:
        return None
    rows = (
        db.query(ArtifactCompetency)
        .filter_by(artifact_id=artifact_id)
        .order_by(ArtifactCompetency.id.asc())
        .all()
    )
    return [
        {
            "cid": row.competency_id,
            "competency_label": row.competency_label,
            "display_label": row.display_label,
            "required_level": row.required_level,
            "required_percent": _percent(row.required_level),
        }
        for row in rows
    ]


def get_artifact_gaps(db: "Session", officer_id: str, artifact_id: str | None = None) -> list[dict] | None:
    officer = db.query(Officer).filter_by(officer_id=officer_id).first()
    if officer is None:
        return None

    query = db.query(OfficerArtifact).filter_by(officer_id=officer_id)
    if artifact_id:
        query = query.filter_by(artifact_id=artifact_id)
    assignments = query.order_by(OfficerArtifact.id.asc()).all()

    rows = []
    for assignment in assignments:
        artifact = assignment.artifact
        if artifact is None:
            continue
        for comp in artifact.competencies:
            latest = _latest_score(db, officer_id, comp.competency_label)
            current_level, source, confidence = _current_level(officer, latest, comp.competency_label)
            required_percent = _percent(comp.required_level)
            current_percent = _percent(current_level)
            gap_percent = round(max(0.0, required_percent - current_percent), 1)
            rows.append(
                {
                    "officer_id": officer_id,
                    "artifact_id": artifact.artifact_id,
                    "artifact_title": artifact.title,
                    "cid": comp.competency_id,
                    "competency": comp.competency_label,
                    "display_competency": comp.display_label,
                    "required_level": comp.required_level,
                    "current_level": round(current_level, 2),
                    "required_percent": required_percent,
                    "current_percent": current_percent,
                    "gap": gap_percent,
                    "gap_status": classify_gap(gap_percent),
                    "score_source": source,
                    "confidence_level": confidence,
                }
            )

    rows.sort(key=lambda item: (-item["gap"], item["artifact_id"], item["competency"]))
    return rows


def get_artifact_recommendations(
    db: "Session",
    officer_id: str,
    artifact_id: str | None = None,
    limit_per_gap: int = 2,
) -> list[dict] | None:
    gaps = get_artifact_gaps(db, officer_id, artifact_id=artifact_id)
    if gaps is None:
        return None
    recs = []
    artifact_by_id = {a.artifact_id: a for a in db.query(WorkArtifact).all()}
    seen = set()
    for gap in gaps:
        if gap["gap"] <= 0:
            continue
        artifact = artifact_by_id.get(gap["artifact_id"])
        if artifact is None:
            continue
        courses = _recommend_courses_for_competency(
            db,
            gap["competency"],
            artifact,
            gap["current_percent"],
            limit=limit_per_gap,
        )
        for course in courses:
            key = (gap["artifact_id"], gap["cid"], course["course_id"])
            if key in seen:
                continue
            seen.add(key)
            recs.append(
                {
                    "artifact_id": gap["artifact_id"],
                    "artifact_title": gap["artifact_title"],
                    "cid": gap["cid"],
                    "competency": gap["competency"],
                    "gap": gap["gap"],
                    "gap_status": gap["gap_status"],
                    **course,
                }
            )
    recs.sort(key=lambda item: (-item["gap"], -item["score"], item["course_id"]))
    return recs


def validate_officer_artifact_assignment(db: "Session", officer_id: str, artifact_id: str) -> bool:
    return (
        db.query(OfficerArtifact)
        .filter_by(officer_id=officer_id, artifact_id=artifact_id)
        .first()
        is not None
    )


def today_iso() -> str:
    return datetime.date.today().isoformat()
