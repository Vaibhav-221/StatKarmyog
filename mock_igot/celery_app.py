"""
Celery application for the Mock-iGOT service.

Handles background status advancement of enrollment records and webhook
dispatch to the LMS backend. Uses Redis as both broker and result backend.

Tasks:
  - advance_enrollment_status(enrollment_id): Move one enrollment forward one
    status step and fire the webhook.
  - advance_all_enrollments(): Iterate all non-Completed enrollments and
    advance each one. Runs on a Celery Beat schedule.
"""

import logging
import random
from datetime import date, datetime

from celery import Celery

from mock_igot.db import SessionLocal, engine, Base
from mock_igot.models import MockEnrollment
from mock_igot.webhook import dispatch_webhook

logger = logging.getLogger(__name__)

# ── Celery app instance ─────────────────────────────────────────────────────

celery_app = Celery(
    "mock_igot",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    # Beat schedule: advance all enrollments every 30 seconds.
    # NOTE: This fast interval is intentional for DEMO purposes.
    # In a real production system, this would run every few hours or once a
    # day, matching the actual pace of course completion on iGOT Karmayogi.
    beat_schedule={
        "advance-all-enrollments-every-30s": {
            "task": "mock_igot.celery_app.advance_all_enrollments",
            "schedule": 30.0,  # seconds
        },
    },
)


# ── Ensure tables exist ─────────────────────────────────────────────────────

Base.metadata.create_all(bind=engine)


# ── Helper: build webhook payload ────────────────────────────────────────────

def _build_webhook_payload(enrollment: MockEnrollment) -> dict:
    """Build the webhook JSON payload from a MockEnrollment record."""
    return {
        "officer_id": enrollment.officer_id,
        "course_id": enrollment.course_id,
        "course_title": enrollment.course_title,
        "status": enrollment.status,
        "progress_percent": enrollment.progress_percent,
        "enrolled_date": enrollment.enrolled_date,
        "completion_date": enrollment.completion_date,
        "event_timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ── Tasks ────────────────────────────────────────────────────────────────────

@celery_app.task(name="mock_igot.celery_app.advance_enrollment_status")
def advance_enrollment_status(enrollment_id: str) -> dict:
    """
    Advance a single enrollment one step forward in its lifecycle:

      Enrolled     → In-Progress  (progress = random 10–40)
      In-Progress  → In-Progress  (progress += random 10–30, capped at 95)
      In-Progress  → Completed    (when progress would exceed 95 → set to 100)
      Completed    → no-op        (already terminal)

    After changing status, dispatches a webhook to the LMS backend.
    Returns the updated enrollment dict.
    """
    session = SessionLocal()
    try:
        enrollment = (
            session.query(MockEnrollment)
            .filter(MockEnrollment.enrollment_id == enrollment_id)
            .first()
        )

        if enrollment is None:
            logger.warning("Enrollment %s not found — skipping.", enrollment_id)
            return {"error": f"Enrollment {enrollment_id} not found"}

        old_status = enrollment.status
        changed = False

        if enrollment.status == "Completed":
            logger.info("Enrollment %s already Completed — no-op.", enrollment_id)
            return {"enrollment_id": enrollment_id, "status": "Completed", "changed": False}

        elif enrollment.status == "Enrolled":
            # Enrolled → In-Progress
            enrollment.status = "In-Progress"
            enrollment.progress_percent = float(random.randint(10, 40))
            changed = True

        elif enrollment.status == "In-Progress":
            # In-Progress → In-Progress (increase) or → Completed (if > 95)
            increment = random.randint(10, 30)
            new_progress = enrollment.progress_percent + increment

            if new_progress > 95:
                # Transition to Completed
                enrollment.status = "Completed"
                enrollment.progress_percent = 100.0
                enrollment.completion_date = date.today().isoformat()
            else:
                # Stay In-Progress with higher progress
                enrollment.progress_percent = new_progress
            changed = True

        if changed:
            session.commit()
            logger.info(
                "Enrollment %s: %s → %s (progress: %.0f%%)",
                enrollment_id,
                old_status,
                enrollment.status,
                enrollment.progress_percent,
            )

            # Dispatch webhook to LMS backend
            payload = _build_webhook_payload(enrollment)
            dispatch_webhook(payload)

        return {
            "enrollment_id": enrollment_id,
            "status": enrollment.status,
            "progress_percent": enrollment.progress_percent,
            "changed": changed,
        }

    except Exception as exc:
        session.rollback()
        logger.error("Error advancing enrollment %s: %s", enrollment_id, exc)
        raise
    finally:
        session.close()


@celery_app.task(name="mock_igot.celery_app.advance_all_enrollments")
def advance_all_enrollments() -> dict:
    """
    Iterate all non-Completed enrollments and advance each one.

    Called by Celery Beat every 30 seconds (demo interval — would be hours/days
    in production to match real course completion pace on iGOT Karmayogi).
    """
    session = SessionLocal()
    try:
        non_completed = (
            session.query(MockEnrollment)
            .filter(MockEnrollment.status != "Completed")
            .all()
        )

        enrollment_ids = [e.enrollment_id for e in non_completed]
        logger.info(
            "Beat cycle: advancing %d non-completed enrollments.",
            len(enrollment_ids),
        )
    finally:
        session.close()

    results = []
    for eid in enrollment_ids:
        # Call the task directly (not .delay()) to run synchronously within
        # the beat-triggered task, keeping the demo simple.
        result = advance_enrollment_status(eid)
        results.append(result)

    return {
        "advanced": len(results),
        "results": results,
    }
