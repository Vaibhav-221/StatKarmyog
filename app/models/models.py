import datetime
from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db import Base


class Officer(Base):
    """Mock officer profile — maps to officer_profiles.json seed data."""
    __tablename__ = "officers"

    officer_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    role_id = Column(String, ForeignKey("roles.role_id"), nullable=False)
    department = Column(String, nullable=False)
    experience_years = Column(Integer, nullable=False)
    qualification = Column(String, nullable=False)
    past_trainings = Column(JSON, default=list)     # list[str]
    current_skills = Column(JSON, default=dict)      # {skill_name: level}

    # Relationships
    role = relationship("Role", back_populates="officers")
    enrollments = relationship("Enrollment", back_populates="officer")
    competency_scores = relationship("CompetencyScore", back_populates="officer")
    assigned_artifacts = relationship("OfficerArtifact", back_populates="officer")


class Role(Base):
    """Role from the competency framework — maps to skill_framework.json roles[]."""
    __tablename__ = "roles"

    role_id = Column(String, primary_key=True, index=True)
    role_title = Column(String, nullable=False)
    expected_skills = Column(JSON, default=dict)     # {skill_name: required_level}

    officers = relationship("Officer", back_populates="role")


class CourseCatalogue(Base):
    """Training course entry — maps to course_catalogue.csv."""
    __tablename__ = "course_catalogue"

    course_id = Column(String, primary_key=True, index=True)
    course_title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    skill_tags = Column(JSON, default=list)           # list[str] (parsed from CSV)
    duration_hours = Column(Integer, nullable=False)
    level = Column(String, nullable=False)
    source = Column(String, nullable=False)


class Enrollment(Base):
    """Officer-course enrollment record — maps to enrollment_status.csv."""
    __tablename__ = "enrollments"

    enrollment_id = Column(String, primary_key=True, index=True)
    officer_id = Column(String, ForeignKey("officers.officer_id"), nullable=False)
    course_id = Column(String, ForeignKey("course_catalogue.course_id"), nullable=False)
    course_title = Column(String, nullable=False)
    status = Column(String, nullable=False)            # Enrolled / In-Progress / Completed
    enrolled_date = Column(String, nullable=True)
    progress_percent = Column(Float, default=0.0)
    completion_date = Column(String, nullable=True)

    officer = relationship("Officer", back_populates="enrollments")
    course = relationship("CourseCatalogue")


class CompetencyDictionary(Base):
    """FRAC Competency Dictionary reference table — maps to frac_competency_dictionary.json."""
    __tablename__ = "competency_dictionary"

    cid = Column(String, primary_key=True, index=True)
    label = Column(String, nullable=False)
    type = Column(String, nullable=False)            # Behavioural / Domain / Functional
    level_descriptions = Column(JSON, nullable=False)  # {"1": "...", "2": "..."}


class WorkArtifact(Base):
    """Role-linked work output assigned to officers for artifact-aware learning."""
    __tablename__ = "work_artifacts"

    artifact_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artifact_type = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    status = Column(String, nullable=False)
    required_competencies = Column(JSON, default=list)
    source_type = Column(String, nullable=False)
    rag_enabled = Column(Boolean, default=True)
    quiz_enabled = Column(Boolean, default=True)
    description = Column(String, nullable=False)
    skills = Column(JSON, default=list)

    competencies = relationship("ArtifactCompetency", back_populates="artifact", cascade="all, delete-orphan")
    officer_assignments = relationship("OfficerArtifact", back_populates="artifact", cascade="all, delete-orphan")


class ArtifactCompetency(Base):
    """Normalized bridge from a work artifact to a FRAC competency."""
    __tablename__ = "artifact_competencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    artifact_id = Column(String, ForeignKey("work_artifacts.artifact_id"), nullable=False, index=True)
    competency_id = Column(String, ForeignKey("competency_dictionary.cid"), nullable=False)
    competency_label = Column(String, nullable=False)
    display_label = Column(String, nullable=False)
    required_level = Column(Float, nullable=False)

    artifact = relationship("WorkArtifact", back_populates="competencies")
    competency = relationship("CompetencyDictionary")


class OfficerArtifact(Base):
    """Assignment of an artifact to an officer."""
    __tablename__ = "officer_artifacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    officer_id = Column(String, ForeignKey("officers.officer_id"), nullable=False, index=True)
    artifact_id = Column(String, ForeignKey("work_artifacts.artifact_id"), nullable=False, index=True)
    assigned_at = Column(String, nullable=False)
    status = Column(String, nullable=False)

    officer = relationship("Officer", back_populates="assigned_artifacts")
    artifact = relationship("WorkArtifact", back_populates="officer_assignments")


class CompetencyScore(Base):
    """Evidence-based competency score record for an officer — maps to competency_history_seed.json."""
    __tablename__ = "competency_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    officer_id = Column(String, ForeignKey("officers.officer_id"), nullable=False, index=True)
    cid = Column(String, ForeignKey("competency_dictionary.cid"), nullable=False)
    skill_label = Column(String, nullable=False)
    quiz_score = Column(Float, nullable=True)
    artifact_score = Column(Float, nullable=True)
    combined_score = Column(Float, nullable=False)
    confidence_level = Column(String, nullable=False)   # "low (1 source)" / "medium (2 sources)"
    source = Column(String, nullable=False)             # e.g. "baseline_quiz", "quiz_after_course_C078"
    recorded_on = Column(String, nullable=False)        # ISO date "YYYY-MM-DD"
    artifact_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    officer = relationship("Officer", back_populates="competency_scores")
    competency = relationship("CompetencyDictionary")


class QuizAttempt(Base):
    """Historical quiz attempt — maps to quiz_attempts_seed.json."""
    __tablename__ = "quiz_attempts"

    attempt_id = Column(String, primary_key=True, index=True)
    officer_id = Column(String, ForeignKey("officers.officer_id"), nullable=False)
    course_id = Column(String, ForeignKey("course_catalogue.course_id"), nullable=True)
    artifact_id = Column(String, ForeignKey("work_artifacts.artifact_id"), nullable=True)
    target_competency = Column(String, nullable=True)
    quiz_source_material = Column(String, nullable=False)
    attempted_on = Column(String, nullable=True)
    raw_score_percent = Column(Float, nullable=True)

    officer = relationship("Officer")
    course = relationship("CourseCatalogue")
    artifact = relationship("WorkArtifact")
    questions = relationship("QuizAttemptQuestion", back_populates="attempt", cascade="all, delete-orphan")
    generated_questions = relationship("QuizAttemptGenerated", back_populates="attempt", cascade="all, delete-orphan")


class QuizAttemptGenerated(Base):
    """Server-side answer key and generated questions for a QuizAttempt."""
    __tablename__ = "quiz_attempts_generated"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id = Column(String, ForeignKey("quiz_attempts.attempt_id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(String, nullable=False)
    options = Column(JSON, nullable=False)
    correct_index = Column(Integer, nullable=False)
    competency_tag = Column(String, ForeignKey("competency_dictionary.cid"), nullable=False)
    explanation = Column(String, nullable=True)

    attempt = relationship("QuizAttempt", back_populates="generated_questions")


class QuizAttemptQuestion(Base):
    """Individual question result within a quiz attempt."""
    __tablename__ = "quiz_attempt_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id = Column(String, ForeignKey("quiz_attempts.attempt_id"), nullable=False)
    competency_tag = Column(String, ForeignKey("competency_dictionary.cid"), nullable=False)
    skill_label = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="questions")


class AdminOutcomeSummary(Base):
    """Pre-computed admin outcome summary data reference table."""
    __tablename__ = "admin_outcome_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    summary_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

