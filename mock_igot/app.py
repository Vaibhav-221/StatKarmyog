"""
Mock-iGOT FastAPI application — runs on port 8001.

Simulates the iGOT Karmayogi platform's enrollment APIs. This is a SEPARATE
service from the LMS backend (port 8000). In production, this would be
replaced by the real iGOT API integration.

Endpoints:
  POST /mock-igot/enroll             — Create a new enrollment
  GET  /mock-igot/enrollments/{id}   — Get enrollments for an officer
  GET  /mock-igot/courses            — Get the course catalogue
  POST /mock-igot/advance/{id}       — Manually trigger status advancement
  GET  /mock-igot/health             — Health check
"""

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from mock_igot.db import SessionLocal, engine, Base
from mock_igot.models import (
    MockEnrollment,
    EnrollRequest,
    EnrollmentResponse,
    CourseResponse,
)
from mock_igot.seed_loader import seed_mock_db, load_course_catalogue
from mock_igot.celery_app import advance_enrollment_status

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ── Module-level cache for course catalogue (loaded once at startup) ─────────

_course_catalogue: list[dict] = []


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed the mock-iGOT database and load course catalogue on startup."""
    global _course_catalogue

    # Create tables + seed from CSV
    Base.metadata.create_all(bind=engine)
    seed_mock_db()

    # Load course catalogue into memory
    _course_catalogue = load_course_catalogue()
    logger.info("Loaded %d courses into catalogue cache.", len(_course_catalogue))

    yield


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mock-iGOT Integration Service",
    description=(
        "Simulates iGOT Karmayogi enrollment APIs for the Skill Intelligence "
        "& Learning Platform. Owns enrollment lifecycle state and pushes "
        "status changes to the LMS backend via webhooks."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/mock-igot/health")
def health_check():
    """Smoke-test endpoint."""
    return {"status": "ok", "service": "mock-igot"}


@app.post("/mock-igot/enroll", response_model=EnrollmentResponse, status_code=201)
def create_enrollment(body: EnrollRequest):
    """
    Create a new enrollment with status 'Enrolled', progress 0, and
    enrolled_date = today. Looks up the course title from the catalogue.
    """
    # Look up course title from catalogue
    course_title = None
    for course in _course_catalogue:
        if course["course_id"] == body.course_id:
            course_title = course["course_title"]
            break

    if course_title is None:
        raise HTTPException(
            status_code=404,
            detail=f"Course '{body.course_id}' not found in catalogue.",
        )

    # Generate a unique enrollment ID
    enrollment_id = f"E{uuid.uuid4().hex[:6].upper()}"

    session = SessionLocal()
    try:
        enrollment = MockEnrollment(
            enrollment_id=enrollment_id,
            officer_id=body.officer_id,
            course_id=body.course_id,
            course_title=course_title,
            status="Enrolled",
            enrolled_date=date.today().isoformat(),
            progress_percent=0.0,
            completion_date=None,
        )
        session.add(enrollment)
        session.commit()
        session.refresh(enrollment)

        logger.info(
            "Created enrollment %s: officer=%s, course=%s",
            enrollment_id,
            body.officer_id,
            body.course_id,
        )

        return enrollment
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@app.get(
    "/mock-igot/enrollments/{officer_id}",
    response_model=list[EnrollmentResponse],
)
def get_officer_enrollments(officer_id: str):
    """
    Return all enrollment records for the given officer from the mock
    service's own database (seeded from enrollment_status.csv + any created
    via /enroll).
    """
    session = SessionLocal()
    try:
        enrollments = (
            session.query(MockEnrollment)
            .filter(MockEnrollment.officer_id == officer_id)
            .all()
        )
        return enrollments
    finally:
        session.close()


@app.get("/mock-igot/courses", response_model=list[CourseResponse])
def get_courses():
    """
    Return the full course catalogue. Simulates iGOT's course catalogue API.
    Data is loaded from seed_data/course_catalogue.csv at startup.
    """
    return _course_catalogue


@app.post("/mock-igot/advance/{enrollment_id}")
def manual_advance(enrollment_id: str):
    """
    Manually trigger status advancement for a single enrollment.

    Useful for live demos — instead of waiting for the 30-second Celery Beat
    cycle, you can call this endpoint to immediately advance an enrollment
    and push the webhook to the LMS backend.
    """
    # Verify the enrollment exists
    session = SessionLocal()
    try:
        enrollment = (
            session.query(MockEnrollment)
            .filter(MockEnrollment.enrollment_id == enrollment_id)
            .first()
        )
        if enrollment is None:
            raise HTTPException(
                status_code=404,
                detail=f"Enrollment '{enrollment_id}' not found.",
            )
    finally:
        session.close()

    # Call the Celery task synchronously (not .delay()) for immediate response
    result = advance_enrollment_status(enrollment_id)
    return result
