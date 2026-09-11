"""
End-to-end tests for POST /api/quiz/generate endpoint (Phase 4B updated).

Uses SQLite in-memory DB and mocks LLM calls so no real API key or network access is needed in CI.
"""

import io
import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_db, Base
from app.models.models import (
    Officer,
    Role,
    CourseCatalogue,
    Enrollment,
    CompetencyDictionary,
    CompetencyScore,
    QuizAttempt,
    QuizAttemptGenerated,
    QuizAttemptQuestion,
    AdminOutcomeSummary,
)
from app.routers.quiz import router as quiz_router


# ── SQLite In-Memory Database ────────────────────────────────────────────────
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


_test_app = FastAPI()
_test_app.include_router(quiz_router, prefix="/api")
_test_app.dependency_overrides[get_db] = override_get_db


from app.seed import (
    _seed_roles,
    _seed_officers,
    _seed_competency_dictionary,
)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    _seed_roles(db)
    _seed_officers(db)
    _seed_competency_dictionary(db)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(_test_app)


FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _good_question(i: int = 0) -> dict:
    return {
        "question": f"Test question {i}?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0,
        "explanation": f"Explanation for question {i}.",
        "competency_tag": "COMP001",
    }


def _mock_generate_mcqs(text, difficulty, language, num_questions=10, **kwargs):
    """Return a list of well-formed mock questions with competency tags."""
    return [_good_question(i) for i in range(num_questions)]


# ── Tests ────────────────────────────────────────────────────────────────────

def test_generate_quiz_success(client):
    """Happy path: valid .txt file, mocked LLM returns valid questions."""
    fixture_content = (FIXTURES_DIR / "sample_doc.txt").read_bytes()

    with patch("app.routers.quiz.generate_mcqs", side_effect=_mock_generate_mcqs):
        with patch("app.routers.quiz.get_cached", return_value=None):
            with patch("app.routers.quiz.set_cached"):
                resp = client.post(
                    "/api/quiz/generate",
                    files={"file": ("sample_doc.txt", fixture_content, "text/plain")},
                    data={
                        "officer_id": "OFF001",
                        "difficulty": "medium",
                        "language": "en",
                        "num_questions": "5",
                    },
                )

    assert resp.status_code == 200
    body = resp.json()
    assert "attempt_id" in body
    assert "questions" in body
    assert len(body["questions"]) == 5

    for q in body["questions"]:
        assert "question" in q
        assert "options" in q
        assert len(q["options"]) == 4
        assert "competency_tag" in q
        assert "correct" in q
        assert isinstance(q["correct"], int)
        assert 0 <= q["correct"] <= 3
        assert "explanation" in q


def test_generate_quiz_invalid_difficulty(client):
    """Invalid difficulty should return 422."""
    fixture_content = (FIXTURES_DIR / "sample_doc.txt").read_bytes()

    resp = client.post(
        "/api/quiz/generate",
        files={"file": ("sample_doc.txt", fixture_content, "text/plain")},
        data={"officer_id": "OFF001", "difficulty": "impossible", "language": "en"},
    )
    assert resp.status_code == 422


def test_generate_quiz_invalid_language(client):
    """Invalid language should return 422."""
    fixture_content = (FIXTURES_DIR / "sample_doc.txt").read_bytes()

    resp = client.post(
        "/api/quiz/generate",
        files={"file": ("sample_doc.txt", fixture_content, "text/plain")},
        data={"officer_id": "OFF001", "difficulty": "easy", "language": "fr"},
    )
    assert resp.status_code == 422


def test_generate_quiz_unsupported_file_type(client):
    """Unsupported file extension should return 422."""
    resp = client.post(
        "/api/quiz/generate",
        files={"file": ("data.xlsx", b"fake excel content", "application/octet-stream")},
        data={"officer_id": "OFF001", "difficulty": "easy", "language": "en"},
    )
    assert resp.status_code == 422


def test_generate_quiz_file_too_large(client):
    """Files exceeding 5 MB should return 413."""
    big_content = b"A" * (6 * 1024 * 1024)  # 6 MB

    resp = client.post(
        "/api/quiz/generate",
        files={"file": ("big.txt", big_content, "text/plain")},
        data={"officer_id": "OFF001", "difficulty": "easy", "language": "en"},
    )
    assert resp.status_code == 413


def test_generate_quiz_empty_document(client):
    """Empty text file should return 422 (too short)."""
    resp = client.post(
        "/api/quiz/generate",
        files={"file": ("empty.txt", b"", "text/plain")},
        data={"officer_id": "OFF001", "difficulty": "easy", "language": "en"},
    )
    assert resp.status_code == 422


def test_generate_quiz_md_file(client):
    """Should accept .md files."""
    content = ("# Heading\n\nThis is a markdown test document with sufficient content. " * 20).encode()

    with patch("app.routers.quiz.generate_mcqs", side_effect=_mock_generate_mcqs):
        with patch("app.routers.quiz.get_cached", return_value=None):
            with patch("app.routers.quiz.set_cached"):
                resp = client.post(
                    "/api/quiz/generate",
                    files={"file": ("notes.md", content, "text/markdown")},
                    data={"officer_id": "OFF001", "difficulty": "hard", "language": "en", "num_questions": "3"},
                )

    assert resp.status_code == 200
    assert len(resp.json()["questions"]) == 3


def test_generate_quiz_cached_response(client):
    """Should return cached questions without calling the LLM."""
    fixture_content = (FIXTURES_DIR / "sample_doc.txt").read_bytes()
    cached_questions = [_good_question(i) for i in range(5)]

    with patch("app.routers.quiz.get_cached", return_value=cached_questions):
        resp = client.post(
            "/api/quiz/generate",
            files={"file": ("sample_doc.txt", fixture_content, "text/plain")},
            data={"officer_id": "OFF001", "difficulty": "medium", "language": "en", "num_questions": "5"},
        )

    assert resp.status_code == 200
    assert len(resp.json()["questions"]) == 5

