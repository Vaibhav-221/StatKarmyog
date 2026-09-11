"""
Webhook receiver router for the LMS backend.

Receives enrollment status change notifications from the iGOT integration
service (or its mock equivalent) and upserts Enrollment records in the
LMS SQLite database. This means GET /api/officers/{id}/enrollments will
reflect live-updating data as the mock service pushes changes.

The webhook contract is designed so the mock-iGOT service can later be
swapped for the real iGOT API without changing this receiver.
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import Enrollment
from app.schemas.webhook_schemas import IgotStatusPayload, WebhookAck

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/webhooks/igot-status", response_model=WebhookAck)
def receive_igot_status(payload: IgotStatusPayload, db: Session = Depends(get_db)):
    """
    Receive an enrollment status change from the iGOT integration service.

    - Finds an existing Enrollment row by (officer_id, course_id).
    - If none exists, creates a new row with an auto-generated enrollment_id.
    - Updates status, progress_percent, and completion_date.
    - Returns 200 {"received": true}.
    """
    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.officer_id == payload.officer_id,
            Enrollment.course_id == payload.course_id,
        )
        .first()
    )

    if enrollment is None:
        # Create a new enrollment row — auto-generate a unique ID
        # Use a deterministic format based on officer + course for readability
        existing_count = db.query(Enrollment).count()
        new_id = f"E{existing_count + 1:04d}"

        # Ensure uniqueness (handle edge cases)
        while db.query(Enrollment).filter(Enrollment.enrollment_id == new_id).first():
            existing_count += 1
            new_id = f"E{existing_count + 1:04d}"

        enrollment = Enrollment(
            enrollment_id=new_id,
            officer_id=payload.officer_id,
            course_id=payload.course_id,
            course_title=payload.course_title,
            status=payload.status,
            enrolled_date=payload.enrolled_date,
            progress_percent=payload.progress_percent,
            completion_date=payload.completion_date,
        )
        db.add(enrollment)
        logger.info(
            "Webhook: CREATED enrollment %s (officer=%s, course=%s, status=%s)",
            new_id,
            payload.officer_id,
            payload.course_id,
            payload.status,
        )
    else:
        # Update existing enrollment
        enrollment.status = payload.status
        enrollment.progress_percent = payload.progress_percent
        enrollment.completion_date = payload.completion_date
        logger.info(
            "Webhook: UPDATED enrollment %s (officer=%s, course=%s, status=%s, progress=%.0f%%)",
            enrollment.enrollment_id,
            payload.officer_id,
            payload.course_id,
            payload.status,
            payload.progress_percent,
        )

    db.commit()
    return WebhookAck(received=True)
