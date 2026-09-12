"""
Pydantic v2 schemas for API request/response validation.
"""

from pydantic import BaseModel, Field


# ── Officer schemas ──────────────────────────────────────────────────────────

class OfficerListItem(BaseModel):
    """Lightweight officer representation for list endpoints."""
    officer_id: str
    name: str
    designation: str
    department: str
    role_id: str

    model_config = {"from_attributes": True}


class OfficerDetail(BaseModel):
    """Full officer profile including skills and training history."""
    officer_id: str
    name: str
    designation: str
    role_id: str
    department: str
    experience_years: int
    qualification: str
    past_trainings: list[str]
    current_skills: dict[str, int]

    model_config = {"from_attributes": True}


# ── Gap Analysis schemas ─────────────────────────────────────────────────────

class SkillGap(BaseModel):
    """A single competency gap for an officer."""
    skill: str
    current_level: float
    expected_level: float
    gap_size: float
    score_source: str
    confidence_level: str


class GapAnalysisResponse(BaseModel):
    """Full gap analysis result for an officer."""
    officer_id: str
    role_id: str
    gaps: list[SkillGap]


class CompetencyScoreItem(BaseModel):
    """Full historical competency score record for an officer."""
    id: int
    officer_id: str
    cid: str
    skill_label: str
    quiz_score: float | None = None
    artifact_score: float | None = None
    combined_score: float
    confidence_level: str
    source: str
    recorded_on: str
    artifact_reference: str | None = None

    model_config = {"from_attributes": True}


class AssessmentCompetencyScore(BaseModel):
    """Competency-wise score inside one quiz/assessment attempt."""
    cid: str
    skill_label: str
    correct_count: int
    total_questions: int
    score_percent: float
    skill_level: float


class AssessmentHistoryItem(BaseModel):
    """Historical quiz/assessment attempt for one officer."""
    attempt_id: str
    officer_id: str
    course_id: str | None = None
    quiz_source_material: str
    attempted_on: str | None = None
    raw_score_percent: float | None = None
    competency_scores: list[AssessmentCompetencyScore]


class WorkEvidenceItem(BaseModel):
    """Work artifact evidence derived from competency score records."""
    id: str
    officer_id: str
    artifact_reference: str
    document_name: str
    recorded_on: str
    source: str
    confidence_level: str
    competencies_detected: list[str]
    scores: dict[str, float]
    summary: str


class WorkArtifactItem(BaseModel):
    artifact_id: str
    title: str
    artifact_type: str
    role: str
    department: str
    domain: str
    difficulty: str
    status: str
    required_competencies: list[str]
    description: str
    skills: list[str]
    rag_enabled: bool = True
    quiz_enabled: bool = True
    assignment_status: str | None = None
    assigned_at: str | None = None


class ArtifactCompetencyItem(BaseModel):
    cid: str
    competency_label: str
    display_label: str
    required_level: float
    required_percent: float


class WorkArtifactDetail(WorkArtifactItem):
    competencies: list[ArtifactCompetencyItem]


class ArtifactGapItem(BaseModel):
    officer_id: str
    artifact_id: str
    artifact_title: str
    cid: str
    competency: str
    display_competency: str
    required_level: float
    current_level: float
    required_percent: float
    current_percent: float
    gap: float
    gap_status: str
    score_source: str
    confidence_level: str


class ArtifactRecommendationItem(BaseModel):
    artifact_id: str
    artifact_title: str
    cid: str
    competency: str
    gap: float
    gap_status: str
    course_id: str
    course_title: str
    matched_skills: list[str]
    score: float
    duration_hours: int
    level: str
    reason: str
    current_percent: float



# ── Recommendation schemas ───────────────────────────────────────────────────

class CourseRecommendation(BaseModel):
    """A course recommended to close competency gaps."""
    course_id: str
    course_title: str
    matched_skills: list[str]
    score: int
    duration_hours: int
    level: str


class HybridCourseRecommendation(BaseModel):
    """A course recommended via hybrid semantic + tag-overlap scoring."""
    course_id: str
    course_title: str
    semantic_score: float
    tag_overlap_score: float
    final_score: float
    matched_skills: list[str]


# ── Enrollment schemas ───────────────────────────────────────────────────────

class EnrollmentItem(BaseModel):
    """Enrollment record for an officer."""
    enrollment_id: str
    officer_id: str
    course_id: str
    course_title: str
    status: str
    enrolled_date: str | None = None
    progress_percent: float
    completion_date: str | None = None

    model_config = {"from_attributes": True}


# ── Course catalogue schemas ─────────────────────────────────────────────────

class CourseItem(BaseModel):
    """A course from the catalogue."""
    course_id: str
    course_title: str
    category: str
    skill_tags: list[str]
    duration_hours: int
    level: str
    source: str

    model_config = {"from_attributes": True}


# ── Health check ──────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"


# ── Quiz Submission schemas (Phase 4B) ────────────────────────────────────────

class QuizSubmitRequest(BaseModel):
    """Request body for POST /api/quiz/submit."""
    attempt_id: str
    officer_id: str
    answers: list[int]


class QuestionResult(BaseModel):
    """Per-question result returned after quiz submission."""
    question_index: int
    competency_tag: str
    skill_label: str
    is_correct: bool
    correct_option_index: int
    explanation: str


class ScoreSummaryItem(BaseModel):
    """Per-competency score summary returned after quiz submission."""
    cid: str
    skill_label: str
    quiz_score: float
    combined_score: float
    confidence_level: str


class QuizSubmitResponse(BaseModel):
    """Response body for POST /api/quiz/submit."""
    attempt_id: str
    results: list[QuestionResult]
    score_summary: list[ScoreSummaryItem]


# ── Passport & Re-Assessment schemas (Phase 5B) ─────────────────────────────

class CompetencyHistoryPoint(BaseModel):
    recorded_on: str
    combined_score: float
    confidence_level: str
    source: str


class CompetencyPassportItem(BaseModel):
    cid: str
    skill_label: str
    history: list[CompetencyHistoryPoint]
    latest_score: float
    first_score: float
    improved: bool | None = None
    delta: float


class PassportResponse(BaseModel):
    officer_id: str
    competencies: list[CompetencyPassportItem]
    message: str | None = None


class ReassessRequest(BaseModel):
    cid: str


class ReassessResponse(BaseModel):
    cid: str
    recommended_action: str
    message: str



# ── Admin Outcome Analytics schemas (Phase 6B) ─────────────────────────────

class AdminGapSummaryItem(BaseModel):
    cid: str
    skill_label: str
    officer_count: int
    avg_current_level: float
    avg_required_level: float
    avg_gap: float
    officers_below_required: int


class AdminGapSummaryResponse(BaseModel):
    department: str | None = None
    items: list[AdminGapSummaryItem]
    note: str


class AdminTrainingEffectivenessItem(BaseModel):
    cid: str
    skill_label: str
    officers_reassessed: int
    avg_improvement: float
    improved_count: int
    declined_count: int
    no_change_count: int


class AdminTrainingEffectivenessResponse(BaseModel):
    items: list[AdminTrainingEffectivenessItem]
    message: str | None = None
    note: str


class AdminDepartmentSummaryItem(BaseModel):
    department: str
    officer_count: int
    avg_gap_across_all_skills: float


class AdminDepartmentSummaryResponse(BaseModel):
    items: list[AdminDepartmentSummaryItem]
    note: str


# ── Error ─────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str

