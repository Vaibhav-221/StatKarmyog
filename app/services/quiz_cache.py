"""
Lightweight in-memory cache for generated quiz results.

Keys are SHA-256 hashes of (extracted_text, difficulty, language, num_questions).
This avoids re-paying for LLM calls when the SAME document is uploaded with the
SAME parameters during repeated demo runs.

NOTE: This is a simple dict-based cache and does NOT persist across server
restarts.  For production, consider a Redis or SQLite-backed cache.
"""

import hashlib
import logging

logger = logging.getLogger(__name__)

# Module-level cache: hash -> list[dict]
_cache: dict[str, list[dict]] = {}


def _make_key(text: str, difficulty: str, language: str, num_questions: int) -> str:
    """Compute a deterministic SHA-256 key for the given inputs."""
    raw = f"{text}|{difficulty}|{language}|{num_questions}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get_cached(text: str, difficulty: str, language: str, num_questions: int) -> list[dict] | None:
    """Return cached questions if available, else None."""
    key = _make_key(text, difficulty, language, num_questions)
    result = _cache.get(key)
    if result is not None:
        logger.info("Quiz cache HIT (key=%s…)", key[:12])
    return result


def set_cached(
    text: str, difficulty: str, language: str, num_questions: int, questions: list[dict]
) -> None:
    """Store generated questions in the cache."""
    key = _make_key(text, difficulty, language, num_questions)
    _cache[key] = questions
    logger.info("Quiz cache SET (key=%s…, %d questions)", key[:12], len(questions))
