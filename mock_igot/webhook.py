"""
Webhook dispatch utility for the Mock-iGOT service.

POSTs enrollment status change payloads to the LMS backend's webhook receiver.
Includes simple retry logic (3 attempts, 2s delay) to tolerate transient
connection issues — but does not crash the Celery task on persistent failure.
"""

import logging
import os
import time

import requests

logger = logging.getLogger(__name__)

LMS_WEBHOOK_URL = os.environ.get(
    "LMS_WEBHOOK_URL",
    "http://localhost:8000/webhooks/igot-status",
)

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def dispatch_webhook(payload: dict) -> bool:
    """
    POST the given payload to LMS_WEBHOOK_URL.

    Returns True if the webhook was delivered successfully, False otherwise.
    Retries up to MAX_RETRIES times on connection errors.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                LMS_WEBHOOK_URL,
                json=payload,
                timeout=10,
            )
            if resp.status_code == 200:
                logger.info(
                    "Webhook delivered for enrollment %s (attempt %d)",
                    payload.get("course_id", "?"),
                    attempt,
                )
                return True
            else:
                logger.warning(
                    "Webhook got status %d (attempt %d): %s",
                    resp.status_code,
                    attempt,
                    resp.text[:200],
                )
        except requests.ConnectionError as exc:
            logger.warning(
                "Webhook connection error (attempt %d/%d): %s",
                attempt,
                MAX_RETRIES,
                exc,
            )
        except requests.RequestException as exc:
            logger.error("Webhook unexpected error: %s", exc)
            return False

        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY_SECONDS)

    logger.error(
        "Webhook delivery FAILED after %d attempts for payload: %s",
        MAX_RETRIES,
        payload,
    )
    return False
