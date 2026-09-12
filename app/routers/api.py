"""
API routers for the Skill Intelligence platform.

All endpoints are mounted under the /api prefix in main.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import (
    Officer,
    CourseCatalogue,
    Enrollment,
    CompetencyScore,
    QuizAttempt,
    QuizAttemptQuestion,
)
from app.schemas.schemas import (
    OfficerListItem,
    OfficerDetail,
    GapAnalysisResponse,
    CourseRecommendation,
    HybridCourseRecommendation,
    EnrollmentItem,
    CourseItem,
    HealthResponse,
    CompetencyScoreItem,
    AssessmentHistoryItem,
    WorkEvidenceItem,
    WorkArtifactItem,
    WorkArtifactDetail,
    ArtifactCompetencyItem,
    ArtifactGapItem,
    ArtifactRecommendationItem,
)
from app.services.gap_analysis import (
    compute_skill_gaps,
    recommend_courses,
    recommend_courses_hybrid,
)
from app.services.work_artifacts import (
    get_artifact,
    get_artifact_competencies,
    get_artifact_gaps,
    get_artifact_recommendations,
    get_officer_artifacts,
    list_artifacts as list_work_artifacts,
)

router = APIRouter()


# ── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Smoke-test endpoint."""
    return {"status": "ok"}


# ── Officers ─────────────────────────────────────────────────────────────────

@router.get("/officers", response_model=list[OfficerListItem])
def list_officers(db: Session = Depends(get_db)):
    """List all officers (lightweight fields only)."""
    return db.query(Officer).all()


@router.get("/officers/{officer_id}", response_model=OfficerDetail)
def get_officer(officer_id: str, db: Session = Depends(get_db)):
    """Full officer profile including current_skills."""
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return officer


# ── Competency Scores ────────────────────────────────────────────────────────

@router.get("/competency-scores/{officer_id}", response_model=list[CompetencyScoreItem])
def get_officer_competency_scores(officer_id: str, db: Session = Depends(get_db)):
    """Return all CompetencyScore rows for an officer ordered by recorded_on ascending."""
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    return (
        db.query(CompetencyScore)
        .filter(CompetencyScore.officer_id == officer_id)
        .order_by(CompetencyScore.recorded_on.asc(), CompetencyScore.id.asc())
        .all()
    )


@router.get("/officers/{officer_id}/assessments", response_model=list[AssessmentHistoryItem])
def get_officer_assessments(officer_id: str, db: Session = Depends(get_db)):
    """Return quiz/assessment history for the requested officer only."""
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.officer_id == officer_id)
        .order_by(QuizAttempt.attempted_on.desc().nullslast(), QuizAttempt.attempt_id.desc())
        .all()
    )

    results = []
    for attempt in attempts:
        questions = (
            db.query(QuizAttemptQuestion)
            .filter(QuizAttemptQuestion.attempt_id == attempt.attempt_id)
            .all()
        )
        grouped: dict[str, dict] = {}
        for question in questions:
            stats = grouped.setdefault(
                question.competency_tag,
                {
                    "cid": question.competency_tag,
                    "skill_label": question.skill_label,
                    "correct_count": 0,
                    "total_questions": 0,
                },
            )
            stats["total_questions"] += 1
            if question.is_correct:
                stats["correct_count"] += 1

        competency_scores = []
        for stats in grouped.values():
            total = stats["total_questions"]
            score_percent = round((stats["correct_count"] / total) * 100, 1) if total else 0.0
            competency_scores.append({
                **stats,
                "score_percent": score_percent,
                "skill_level": round(1 + (score_percent / 100) * 4, 1),
            })

        results.append({
            "attempt_id": attempt.attempt_id,
            "officer_id": attempt.officer_id,
            "course_id": attempt.course_id,
            "quiz_source_material": attempt.quiz_source_material,
            "attempted_on": attempt.attempted_on,
            "raw_score_percent": attempt.raw_score_percent,
            "competency_scores": competency_scores,
        })

    return results


@router.get("/officers/{officer_id}/work-evidence", response_model=list[WorkEvidenceItem])
def get_officer_work_evidence(officer_id: str, db: Session = Depends(get_db)):
    """Return work artifact evidence represented in CompetencyScore rows for one officer."""
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    scores = (
        db.query(CompetencyScore)
        .filter(
            CompetencyScore.officer_id == officer_id,
            CompetencyScore.artifact_reference.isnot(None),
        )
        .order_by(CompetencyScore.recorded_on.desc(), CompetencyScore.id.desc())
        .all()
    )

    grouped: dict[str, dict] = {}
    for score in scores:
        artifact_key = score.artifact_reference or f"score-{score.id}"
        item = grouped.setdefault(
            artifact_key,
            {
                "id": artifact_key,
                "officer_id": officer_id,
                "artifact_reference": artifact_key,
                "document_name": artifact_key.replace("\\", "/").split("/")[-1],
                "recorded_on": score.recorded_on,
                "source": score.source,
                "confidence_level": score.confidence_level,
                "competencies_detected": [],
                "scores": {},
                "summary": "Evidence derived from existing competency score history for this officer.",
            },
        )
        item["competencies_detected"].append(score.skill_label)
        if score.artifact_score is not None:
            item["scores"][score.skill_label] = score.artifact_score

    return list(grouped.values())


# ── Work Artifacts ───────────────────────────────────────────────────────────

@router.get("/artifacts", response_model=list[WorkArtifactItem])
def list_artifacts(db: Session = Depends(get_db)):
    """Return all work artifacts from the database."""
    return list_work_artifacts(db)


@router.get("/artifacts/{artifact_id}", response_model=WorkArtifactDetail)
def get_artifact_detail(artifact_id: str, db: Session = Depends(get_db)):
    """Return one work artifact plus its normalized required competencies."""
    artifact = get_artifact(db, artifact_id)
    if artifact is None:
        raise HTTPException(status_code=404, detail=f"Artifact '{artifact_id}' not found")
    return artifact


@router.get("/officers/{officer_id}/artifacts", response_model=list[WorkArtifactItem])
def get_assigned_work_artifacts(officer_id: str, db: Session = Depends(get_db)):
    """Return work artifacts assigned to a single officer."""
    artifacts = get_officer_artifacts(db, officer_id)
    if artifacts is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return artifacts


@router.get("/artifacts/{artifact_id}/competencies", response_model=list[ArtifactCompetencyItem])
def get_required_artifact_competencies(artifact_id: str, db: Session = Depends(get_db)):
    """Return FRAC-linked competencies required by a work artifact."""
    competencies = get_artifact_competencies(db, artifact_id)
    if competencies is None:
        raise HTTPException(status_code=404, detail=f"Artifact '{artifact_id}' not found")
    return competencies


@router.get("/officers/{officer_id}/artifact-gaps", response_model=list[ArtifactGapItem])
def get_officer_artifact_gaps(
    officer_id: str,
    artifact_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return artifact-specific competency gaps for an officer."""
    gaps = get_artifact_gaps(db, officer_id, artifact_id=artifact_id)
    if gaps is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return gaps


@router.get("/officers/{officer_id}/artifact-recommendations", response_model=list[ArtifactRecommendationItem])
def get_officer_artifact_recommendations(
    officer_id: str,
    artifact_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return explainable course recommendations for artifact competency gaps."""
    recs = get_artifact_recommendations(db, officer_id, artifact_id=artifact_id)
    if recs is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return recs


# ── Gap Analysis ─────────────────────────────────────────────────────────────

@router.get("/officers/{officer_id}/gaps", response_model=GapAnalysisResponse)
def get_officer_gaps(officer_id: str, db: Session = Depends(get_db)):
    """Competency gap analysis for an officer vs. their role's expected skills."""
    result = compute_skill_gaps(db, officer_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return result



# ── Course Recommendations ──────────────────────────────────────────────────

@router.get(
    "/officers/{officer_id}/recommendations",
    response_model=list[CourseRecommendation],
)
def get_officer_recommendations(
    officer_id: str,
    top_n: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Recommend courses to close the officer's competency gaps.
    top_n controls result count (default 5, max 20).
    """
    recs = recommend_courses(db, officer_id, top_n=top_n)
    if recs is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return recs


@router.get(
    "/officers/{officer_id}/recommendations/semantic",
    response_model=list[HybridCourseRecommendation],
)
def get_officer_recommendations_semantic(
    officer_id: str,
    top_n: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Hybrid course recommendations combining semantic similarity (0.6 weight)
    with tag-overlap scoring (0.4 weight). Both component scores are included
    in the response for transparency.
    """
    recs = recommend_courses_hybrid(db, officer_id, top_n=top_n)
    if recs is None:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")
    return recs


# ── Enrollments ──────────────────────────────────────────────────────────────

@router.get(
    "/officers/{officer_id}/enrollments",
    response_model=list[EnrollmentItem],
)
def get_officer_enrollments(officer_id: str, db: Session = Depends(get_db)):
    """Return enrollment records for an officer."""
    # Verify officer exists first
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    return (
        db.query(Enrollment)
        .filter(Enrollment.officer_id == officer_id)
        .all()
    )


# ── Competency Passport & Re-Assessment (Phase 5B) ──────────────────────────

from app.models.models import Role, CompetencyDictionary
from app.schemas.schemas import (
    PassportResponse,
    CompetencyPassportItem,
    ReassessRequest,
    ReassessResponse,
)
from app.services.passport_engine import summarize_competency_history


@router.get("/passport/{officer_id}", response_model=PassportResponse)
def get_passport_summary(officer_id: str, db: Session = Depends(get_db)):
    """
    Return competency passport history for an officer.
    Queries CompetencyScore records grouped by cid, ordered by recorded_on ascending.
    Computes first_score, latest_score, improved, and delta per competency.
    """
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    scores = (
        db.query(CompetencyScore)
        .filter(CompetencyScore.officer_id == officer_id)
        .order_by(CompetencyScore.cid.asc(), CompetencyScore.recorded_on.asc(), CompetencyScore.id.asc())
        .all()
    )

    if not scores:
        return PassportResponse(
            officer_id=officer_id,
            competencies=[],
            message="No assessment history yet — scores are based on the static role profile"
        )

    # Group scores by cid preserving order
    grouped: dict[str, list[dict]] = {}
    skill_labels: dict[str, str] = {}

    for s in scores:
        if s.cid not in grouped:
            grouped[s.cid] = []
            skill_labels[s.cid] = s.skill_label
        grouped[s.cid].append({
            "recorded_on": s.recorded_on,
            "combined_score": s.combined_score,
            "confidence_level": s.confidence_level,
            "source": s.source,
        })

    competencies = []
    for cid, history in grouped.items():
        summary = summarize_competency_history(history)
        competencies.append(
            CompetencyPassportItem(
                cid=cid,
                skill_label=skill_labels[cid],
                history=history,
                latest_score=summary["latest_score"],
                first_score=summary["first_score"],
                improved=summary["improved"],
                delta=summary["delta"],
            )
        )

    return PassportResponse(
        officer_id=officer_id,
        competencies=competencies,
    )


@router.post("/passport/{officer_id}/reassess", response_model=ReassessResponse)
def reassess_competency(
    officer_id: str,
    payload: ReassessRequest,
    db: Session = Depends(get_db),
):
    """
    Validate that cid is one of the officer's required role competencies and return re-assessment trigger advice.
    """
    officer = db.query(Officer).filter(Officer.officer_id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail=f"Officer '{officer_id}' not found")

    role = db.query(Role).filter(Role.role_id == officer.role_id).first()
    if not role or not role.expected_skills:
        raise HTTPException(status_code=404, detail=f"Role required competencies not found for officer '{officer_id}'")

    cid_input = payload.cid.strip()

    # Look up competency in dictionary if cid_input is CID or label
    comp_entry = (
        db.query(CompetencyDictionary)
        .filter(
            (CompetencyDictionary.cid == cid_input) | (CompetencyDictionary.label == cid_input)
        )
        .first()
    )

    # Check if the requested competency is required by the officer's role
    expected = role.expected_skills  # dict of {skill_label: level}
    is_required = False
    resolved_cid = cid_input

    if comp_entry:
        resolved_cid = comp_entry.cid
        if comp_entry.label in expected or comp_entry.cid in expected:
            is_required = True
    elif cid_input in expected:
        is_required = True

    if not is_required:
        raise HTTPException(
            status_code=404,
            detail=f"Competency '{cid_input}' is not a required competency for officer '{officer_id}'"
        )

    return ReassessResponse(
        cid=resolved_cid,
        recommended_action="retake_quiz",
        message="Re-assessment ready. Route officer to quiz generation for this competency's linked course material."
    )


# ── Course Catalogue ────────────────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseItem])
def list_courses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Paginated course catalogue listing."""
    return db.query(CourseCatalogue).offset(skip).limit(limit).all()


# ── Admin Outcome Analytics (Phase 6B) ──────────────────────────────────────

from app.schemas.schemas import (
    AdminGapSummaryResponse,
    AdminTrainingEffectivenessResponse,
    AdminDepartmentSummaryResponse,
)
from app.services.admin_analytics import (
    compute_admin_gap_summary,
    compute_admin_training_effectiveness,
    compute_admin_department_summary,
)


@router.get("/admin/gap-summary", response_model=AdminGapSummaryResponse)
def get_admin_gap_summary(
    department: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return org-wide or department-filtered competency gap summary."""
    return compute_admin_gap_summary(db, department=department)


@router.get("/admin/training-effectiveness", response_model=AdminTrainingEffectivenessResponse)
def get_admin_training_effectiveness(db: Session = Depends(get_db)):
    """Return pre/post training improvement statistics for reassessed competencies."""
    return compute_admin_training_effectiveness(db)


@router.get("/admin/department-summary", response_model=AdminDepartmentSummaryResponse)
def get_admin_department_summary(db: Session = Depends(get_db)):
    """Return department breakdown of average skill gaps."""
    return compute_admin_department_summary(db)



