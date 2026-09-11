"""
Admin Analytics Service — Org-wide competency metrics & training outcome analysis.

Pure business-logic functions — no FastAPI dependencies so they can be unit-tested
and reused by the admin analytics endpoints.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from app.models.models import Officer, Role, CompetencyScore, CompetencyDictionary
from app.services.passport_engine import summarize_competency_history

NOTE_TEXT = (
    "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), "
    "with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
)


def compute_admin_gap_summary(
    db: "Session",
    department: str | None = None,
) -> dict[str, Any]:
    """
    Compute org-wide (or department-filtered) competency gap summary across officers.
    Handles officers with NO CompetencyScore history by falling back to static profile
    skills so all officers in scope contribute to averages.
    """
    query = db.query(Officer)
    if department:
        query = query.filter(Officer.department == department)
    officers = query.all()

    if not officers:
        return {
            "department": department,
            "items": [],
            "note": NOTE_TEXT,
        }

    roles = {r.role_id: r for r in db.query(Role).all()}
    comp_dict = {c.label: c.cid for c in db.query(CompetencyDictionary).all()}

    # Accumulated metrics per skill_label
    metrics: dict[str, dict[str, Any]] = {}

    for officer in officers:
        role = roles.get(officer.role_id)
        if not role or not role.expected_skills:
            continue

        # Get officer's latest score per skill_label
        officer_scores = (
            db.query(CompetencyScore)
            .filter(CompetencyScore.officer_id == officer.officer_id)
            .order_by(CompetencyScore.recorded_on.desc(), CompetencyScore.id.desc())
            .all()
        )

        latest_scores: dict[str, float] = {}
        score_cids: dict[str, str] = {}
        for s in officer_scores:
            if s.skill_label not in latest_scores:
                latest_scores[s.skill_label] = float(s.combined_score)
                score_cids[s.skill_label] = s.cid

        current_skills = officer.current_skills or {}
        expected_skills = role.expected_skills or {}

        for skill_label, req_val in expected_skills.items():
            req_level = float(req_val)
            if skill_label in latest_scores:
                curr_level = latest_scores[skill_label]
            else:
                curr_level = float(current_skills.get(skill_label, 0))

            if skill_label not in metrics:
                cid = score_cids.get(skill_label) or comp_dict.get(skill_label, skill_label)
                metrics[skill_label] = {
                    "cid": cid,
                    "skill_label": skill_label,
                    "officer_count": 0,
                    "total_current": 0.0,
                    "total_required": 0.0,
                    "below_count": 0,
                }

            m = metrics[skill_label]
            m["officer_count"] += 1
            m["total_current"] += curr_level
            m["total_required"] += req_level
            if curr_level < req_level:
                m["below_count"] += 1

    items = []
    for skill_label, m in metrics.items():
        count = m["officer_count"]
        if count == 0:
            continue
        avg_curr = round(m["total_current"] / count, 2)
        avg_req = round(m["total_required"] / count, 2)
        avg_gap = round(avg_req - avg_curr, 2)

        items.append({
            "cid": m["cid"],
            "skill_label": skill_label,
            "officer_count": count,
            "avg_current_level": avg_curr,
            "avg_required_level": avg_req,
            "avg_gap": avg_gap,
            "officers_below_required": m["below_count"],
        })

    # Sort by avg_gap descending
    items.sort(key=lambda x: x["avg_gap"], reverse=True)

    return {
        "department": department,
        "items": items,
        "note": NOTE_TEXT,
    }


def compute_admin_training_effectiveness(db: "Session") -> dict[str, Any]:
    """
    Compute pre/post training improvement metrics for competencies with 2+ scores per officer.
    """
    all_scores = (
        db.query(CompetencyScore)
        .order_by(CompetencyScore.recorded_on.asc(), CompetencyScore.id.asc())
        .all()
    )

    # Group scores by (skill_label, cid) and officer_id
    grouped: dict[tuple[str, str], dict[str, list[dict]]] = {}
    for s in all_scores:
        key = (s.skill_label, s.cid)
        if key not in grouped:
            grouped[key] = {}
        if s.officer_id not in grouped[key]:
            grouped[key][s.officer_id] = []
        grouped[key][s.officer_id].append({
            "recorded_on": s.recorded_on,
            "combined_score": s.combined_score,
            "confidence_level": s.confidence_level,
            "source": s.source,
        })

    items = []
    for (skill_label, cid), officer_dict in grouped.items():
        # Keep only officers with 2+ scores
        reassessed = {off_id: history for off_id, history in officer_dict.items() if len(history) >= 2}
        if not reassessed:
            continue

        reassessed_count = len(reassessed)
        total_delta = 0.0
        improved_count = 0
        declined_count = 0
        no_change_count = 0

        for history in reassessed.values():
            summary = summarize_competency_history(history)
            delta = summary["delta"]
            total_delta += delta

            if summary["improved"] is True:
                improved_count += 1
            elif summary["improved"] is False and delta < 0:
                declined_count += 1
            else:
                no_change_count += 1

        avg_imp = round(total_delta / reassessed_count, 2)
        items.append({
            "cid": cid,
            "skill_label": skill_label,
            "officers_reassessed": reassessed_count,
            "avg_improvement": avg_imp,
            "improved_count": improved_count,
            "declined_count": declined_count,
            "no_change_count": no_change_count,
        })

    items.sort(key=lambda x: x["avg_improvement"], reverse=True)

    if not items:
        return {
            "items": [],
            "message": "No re-assessment data yet — officers need to retake at least one quiz per competency to populate this view",
            "note": NOTE_TEXT,
        }

    return {
        "items": items,
        "message": None,
        "note": NOTE_TEXT,
    }


def compute_admin_department_summary(db: "Session") -> dict[str, Any]:
    """
    Compute average skill gap grouped by department.
    """
    officers = db.query(Officer).all()
    roles = {r.role_id: r for r in db.query(Role).all()}

    depts: dict[str, list[Officer]] = {}
    for o in officers:
        depts.setdefault(o.department, []).append(o)

    items = []
    for dept_name, dept_officers in depts.items():
        officer_count = len(dept_officers)
        dept_gaps: list[float] = []

        for officer in dept_officers:
            role = roles.get(officer.role_id)
            if not role or not role.expected_skills:
                continue

            officer_scores = (
                db.query(CompetencyScore)
                .filter(CompetencyScore.officer_id == officer.officer_id)
                .order_by(CompetencyScore.recorded_on.desc(), CompetencyScore.id.desc())
                .all()
            )

            latest_scores: dict[str, float] = {}
            for s in officer_scores:
                if s.skill_label not in latest_scores:
                    latest_scores[s.skill_label] = float(s.combined_score)

            current_skills = officer.current_skills or {}
            expected_skills = role.expected_skills or {}

            for skill_label, req_val in expected_skills.items():
                req_level = float(req_val)
                if skill_label in latest_scores:
                    curr_level = latest_scores[skill_label]
                else:
                    curr_level = float(current_skills.get(skill_label, 0))

                gap = max(0.0, req_level - curr_level)
                dept_gaps.append(gap)

        avg_dept_gap = round(sum(dept_gaps) / len(dept_gaps), 2) if dept_gaps else 0.0
        items.append({
            "department": dept_name,
            "officer_count": officer_count,
            "avg_gap_across_all_skills": avg_dept_gap,
        })

    items.sort(key=lambda x: x["avg_gap_across_all_skills"], reverse=True)

    return {
        "items": items,
        "note": NOTE_TEXT,
    }
