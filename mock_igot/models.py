"""
SQLAlchemy model and Pydantic schemas for the Mock-iGOT service.

The MockEnrollment table mirrors what iGOT's real enrollment store would look
like, with its own lifecycle state (status, progress_percent, completion_date).
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Column, String, Float

from mock_igot.db import Base


# ── SQLAlchemy ORM model ─────────────────────────────────────────────────────

class MockEnrollment(Base):
    """Enrollment record in the mock-iGOT service's own database."""
    __tablename__ = "mock_enrollments"

    enrollment_id = Column(String, primary_key=True, index=True)
    officer_id = Column(String, nullable=False, index=True)
    course_id = Column(String, nullable=False)
    course_title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Enrolled")
    enrolled_date = Column(String, nullable=True)
    progress_percent = Column(Float, default=0.0)
    completion_date = Column(String, nullable=True)


# ── Pydantic schemas ────────────────────────────────────────────────────────

class EnrollRequest(BaseModel):
    """Body for POST /mock-igot/enroll."""
    officer_id: str
    course_id: str


class EnrollmentResponse(BaseModel):
    """Single enrollment record returned by the mock service."""
    enrollment_id: str
    officer_id: str
    course_id: str
    course_title: str
    status: str
    enrolled_date: str | None = None
    progress_percent: float
    completion_date: str | None = None

    model_config = {"from_attributes": True}


class CourseResponse(BaseModel):
    """A course from the mock-iGOT catalogue."""
    course_id: str
    course_title: str
    category: str
    skill_tags: str  # raw CSV string — mock service passes it through as-is
    duration_hours: int
    level: str
    source: str


class WebhookPayload(BaseModel):
    """
    Payload POSTed to the LMS webhook receiver when an enrollment status changes.
    Matches the contract the LMS side expects.
    """
    officer_id: str
    course_id: str
    course_title: str
    status: str
    progress_percent: float
    enrolled_date: str | None = None
    completion_date: str | None = None
    event_timestamp: str
