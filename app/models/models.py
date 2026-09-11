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
    quiz_source_material = Column(String, nullable=False)
    attempted_on = Column(String, nullable=True)
    raw_score_percent = Column(Float, nullable=True)

    officer = relationship("Officer")
    course = relationship("CourseCatalogue")
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

