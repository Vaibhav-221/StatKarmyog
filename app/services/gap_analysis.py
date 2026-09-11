"""
Gap Analysis & Recommendation Service

Pure business-logic functions — no FastAPI dependencies so they can be
unit-tested and reused by later phases (dashboards, admin analytics).
"""

from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from app.models.models import Officer, Role, CourseCatalogue, CompetencyScore

logger = logging.getLogger(__name__)


def _semantic_search_enabled() -> bool:
    """Return whether memory-heavy semantic recommendation should run."""
    value = os.environ.get("ENABLE_SEMANTIC_SEARCH", "true").strip().lower()
    return value in {"1", "true", "yes", "on"}


def _tag_recommendations_as_hybrid(
    db: "Session",
    officer_id: str,
    top_n: int,
) -> list[dict] | None:
    """Shape lightweight tag recommendations like the hybrid endpoint response."""
    tag_recs = recommend_courses(db, officer_id, top_n=top_n)
    if tag_recs is None:
        return None

    max_score = max((rec["score"] for rec in tag_recs), default=1)
    max_score = max_score or 1

    return [
        {
            "course_id": rec["course_id"],
            "course_title": rec["course_title"],
            "semantic_score": 0.0,
            "tag_overlap_score": round(rec["score"] / max_score, 4),
            "final_score": round(rec["score"] / max_score, 4),
            "matched_skills": rec["matched_skills"],
        }
        for rec in tag_recs
    ]


# ── Gap Analysis ─────────────────────────────────────────────────────────────

def compute_skill_gaps(
    db: "Session",
    officer_id: str,
) -> dict | None:
    """
    Compare an officer's current skills against the expected skills for
    their role using evidence-based competency scores when available,
    falling back to profile-only skills if no competency score exists.

    Returns a dict with officer_id, role_id, and a list of gap dicts
    sorted by gap_size descending (largest gap first).

    Returns None if the officer or their role is not found.
    """
    officer: Officer | None = db.query(Officer).filter(
        Officer.officer_id == officer_id
    ).first()

    if officer is None:
        return None

    role: Role | None = db.query(Role).filter(
        Role.role_id == officer.role_id
    ).first()

    if role is None:
        return None

    current: dict[str, int] = officer.current_skills or {}
    expected: dict[str, int] = role.expected_skills or {}

    gaps: list[dict] = []
    for skill, required_level in expected.items():
        # Look up latest CompetencyScore for officer_id + skill_label
        latest_score = (
            db.query(CompetencyScore)
            .filter(
                CompetencyScore.officer_id == officer_id,
                CompetencyScore.skill_label == skill,
            )
            .order_by(CompetencyScore.recorded_on.desc(), CompetencyScore.id.desc())
            .first()
        )

        if latest_score is not None:
            current_level = latest_score.combined_score
            score_source = "evidence-based"
            confidence_level = latest_score.confidence_level
        else:
            current_level = float(current.get(skill, 0))
            score_source = "profile-fallback"
            confidence_level = "profile-only"

        if current_level < required_level:
            gap_size = round(required_level - current_level, 2)
            gaps.append(
                {
                    "skill": skill,
                    "current_level": current_level,
                    "expected_level": required_level,
                    "gap_size": gap_size,
                    "score_source": score_source,
                    "confidence_level": confidence_level,
                }
            )

    # Sort by gap_size descending (largest gap first)
    gaps.sort(key=lambda g: g["gap_size"], reverse=True)

    return {
        "officer_id": officer_id,
        "role_id": officer.role_id,
        "gaps": gaps,
    }



# ── Course Recommendations ──────────────────────────────────────────────────

def recommend_courses(
    db: "Session",
    officer_id: str,
    top_n: int = 5,
) -> list[dict] | None:
    """
    Recommend courses that address an officer's competency gaps.

    1. Compute the officer's gap skills (reuses compute_skill_gaps directly).
    2. For every course in the catalogue, compute set-intersection between
       the course's skill_tags and the officer's gap skills.
    3. Score = number of overlapping tags.  Courses with score == 0 are
       excluded.  Results sorted by score descending.

    Returns None if the officer is not found.
    Returns an empty list if there are no gaps or no matching courses.
    """
    gap_result = compute_skill_gaps(db, officer_id)
    if gap_result is None:
        return None

    gap_skills: set[str] = {g["skill"] for g in gap_result["gaps"]}
    if not gap_skills:
        return []

    courses: list[CourseCatalogue] = db.query(CourseCatalogue).all()

    recommendations: list[dict] = []
    for course in courses:
        tags: set[str] = set(course.skill_tags or [])
        matched = gap_skills & tags
        if matched:
            recommendations.append(
                {
                    "course_id": course.course_id,
                    "course_title": course.course_title,
                    "matched_skills": sorted(matched),
                    "score": len(matched),
                    "duration_hours": course.duration_hours,
                    "level": course.level,
                }
            )

    # Sort by score descending, then by course_id for determinism
    recommendations.sort(key=lambda r: (-r["score"], r["course_id"]))

    return recommendations[:top_n]


# ── Hybrid (Semantic + Tag) Recommendations ─────────────────────────────────

def recommend_courses_hybrid(
    db: "Session",
    officer_id: str,
    top_n: int = 5,
) -> list[dict] | None:
    """
    Hybrid course recommendations combining semantic similarity and tag overlap.

    1. Compute the officer's gap skills (reuses compute_skill_gaps).
    2. Build a query string from gap skills for semantic search.
    3. Query ChromaDB for top-k semantically similar courses (k = top_n * 2).
    4. Score each candidate with tag overlap against gap skills.
    5. Combine: final_score = 0.6 * norm_semantic + 0.4 * norm_tag_overlap
       (both normalised to 0-1).
    6. Return top_n courses sorted by final_score descending.

    Returns None if the officer is not found.
    Returns an empty list if there are no gaps.
    """
    if not _semantic_search_enabled():
        return _tag_recommendations_as_hybrid(db, officer_id, top_n)

    gap_result = compute_skill_gaps(db, officer_id)
    if gap_result is None:
        return None

    gap_skills: set[str] = {g["skill"] for g in gap_result["gaps"]}
    if not gap_skills:
        return []

    # Build semantic query from gap skills
    query_text = "Skills needed: " + ", ".join(sorted(gap_skills))

    # Retrieve a larger pool to re-rank
    pool_size = max(top_n * 2, 10)
    try:
        from app.services.semantic_search import query_similar_courses

        candidates = query_similar_courses(query_text, n_results=pool_size)
    except Exception as exc:
        logger.warning("Semantic recommendations unavailable; falling back to tag matching: %s", exc)
        return _tag_recommendations_as_hybrid(db, officer_id, top_n)

    if not candidates:
        return []

    # --- Compute raw scores ---
    # Semantic: ChromaDB returns L2 distances; convert to similarity.
    # similarity = 1 / (1 + distance)  →  range (0, 1]
    for c in candidates:
        c["semantic_similarity"] = 1.0 / (1.0 + c["semantic_distance"])

    # Tag overlap: count of matching gap skills / total gap skills
    for c in candidates:
        tags = set(c.get("skill_tags") or [])
        matched = gap_skills & tags
        c["matched_skills"] = sorted(matched)
        c["tag_overlap_count"] = len(matched)

    # --- Normalise both to 0-1 ---
    sem_values = [c["semantic_similarity"] for c in candidates]
    sem_min, sem_max = min(sem_values), max(sem_values)
    sem_range = sem_max - sem_min if sem_max != sem_min else 1.0

    tag_values = [c["tag_overlap_count"] for c in candidates]
    tag_max = max(tag_values) if tag_values else 1
    tag_max = tag_max if tag_max > 0 else 1  # avoid division by zero

    for c in candidates:
        norm_sem = (c["semantic_similarity"] - sem_min) / sem_range
        norm_tag = c["tag_overlap_count"] / tag_max

        c["semantic_score"] = round(norm_sem, 4)
        c["tag_overlap_score"] = round(norm_tag, 4)
        c["final_score"] = round(0.6 * norm_sem + 0.4 * norm_tag, 4)

    # Sort by final_score descending, then course_id for determinism
    candidates.sort(key=lambda c: (-c["final_score"], c["course_id"]))

    # Shape the response
    results = []
    for c in candidates[:top_n]:
        results.append({
            "course_id": c["course_id"],
            "course_title": c["course_title"],
            "semantic_score": c["semantic_score"],
            "tag_overlap_score": c["tag_overlap_score"],
            "final_score": c["final_score"],
            "matched_skills": c["matched_skills"],
        })

    return results
