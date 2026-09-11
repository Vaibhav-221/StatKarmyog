"""
Pydantic schemas for the LMS webhook receiver.

Defines the expected shape of incoming webhook payloads from the iGOT
integration service (or its mock equivalent) and the acknowledgement response.
"""

from pydantic import BaseModel


class IgotStatusPayload(BaseModel):
    """
    Incoming webhook payload from iGOT (or mock-iGOT) when an enrollment
    status changes. The LMS backend uses this to upsert Enrollment rows
    in its own database.
    """
    officer_id: str
    course_id: str
    course_title: str
    status: str
    progress_percent: float
    enrolled_date: str | None = None
    completion_date: str | None = None
    event_timestamp: str


class WebhookAck(BaseModel):
    """Acknowledgement response returned by the webhook receiver."""
    received: bool = True
