"""
End-to-end tests for Phase 4B: Quiz generate + submit + gap-analysis evidence loop.

Uses an in-memory SQLite DB seeded with real data.  LLM calls are mocked
so no API key is needed in CI.
"""

import pytest
from unittest.mock import patch, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, get_db
from app.models.models import (
    CompetencyDictionary,
    CompetencyScore,
    Officer,
    QuizAttempt,
    QuizAttemptGenerated,
    QuizAttemptQuestion,
    Role,
)
from app.routers.quiz import router as quiz_router
from app.routers.api import router as api_router
from app.seed import (
    _seed_roles,
    _seed_officers,
    _seed_competency_dictionary,
)


# ── In-memory DB fixtures ───────────────────────────────────────────────────

@pytest.fixture(scope="module")
def engine():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    return eng


@pytest.fixture(scope="module")
def SessionFactory(engine):
    return sessionmaker(bind=engine)


@pytest.fixture(scope="module")
def seeded_session(SessionFactory):
    """Seed officers, roles, competency dictionary once for the module."""
    session = SessionFactory()
    _seed_roles(session)
    _seed_officers(session)
    _seed_competency_dictionary(session)
    session.commit()
    yield session
    session.close()


@pytest.fixture()
def db_session(SessionFactory, seeded_session):
    """
    Per-test transactional session.  Uses a nested transaction so each
    test's writes are rolled back, keeping the base seed intact.
    """
    connection = SessionFactory.kw["bind"].connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    # Copy seed data into the transactional session scope — since we're
    # using the same engine, the seeded rows are already visible.
    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient wired to the per-test DB session."""
    app = FastAPI()
    app.include_router(quiz_router, prefix="/api")
    app.include_router(api_router, prefix="/api")

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    return TestClient(app)


# ── Mock LLM data ───────────────────────────────────────────────────────────

# Use CIDs that exist in frac_competency_dictionary.json
MOCK_QUESTIONS = [
    {
        "question": "What is the primary purpose of stratified sampling?",
        "options": [
            "To reduce sampling error by dividing the population into homogeneous groups",
            "To increase the sample size",
            "To eliminate non-response bias",
            "To simplify data collection",
        ],
        "correct": 0,
        "explanation": "Stratified sampling divides the population into strata.",
        "competency_tag": "CID-D-102",  # Sampling
    },
    {
        "question": "What does CPI stand for?",
        "options": [
            "Consumer Price Index",
            "Central Processing Indicator",
            "Composite Price Indicator",
            "Consumer Payment Index",
        ],
        "correct": 0,
        "explanation": "CPI stands for Consumer Price Index.",
        "competency_tag": "CID-D-104",  # Price Statistics
    },
    {
        "question": "Which Python library is commonly used for data analysis?",
        "options": ["Pandas", "Flask", "Django", "Pygame"],
        "correct": 0,
        "explanation": "Pandas is the standard data analysis library.",
        "competency_tag": "CID-D-102",  # Sampling — same tag as Q0 on purpose
    },
]



def _mock_generate_mcqs(text, difficulty, language, num_questions=10, valid_competencies=None, **kwargs):
    """Return the fixed 3-question mock payload."""
    return MOCK_QUESTIONS[:num_questions] if num_questions <= 3 else MOCK_QUESTIONS


# ── Helpers ──────────────────────────────────────────────────────────────────

FIXTURE_FILE_CONTENT = (
    b"This is a sample document about sampling methodology and price statistics. "
    b"It covers stratified sampling techniques used in national-level surveys, "
    b"consumer price index compilation procedures, and quality assurance protocols. "
    b"The document also discusses Python-based data analysis pipelines for processing "
    b"large-scale survey datasets collected across multiple states and union territories. "
    b"Statistical quality frameworks and metadata standards are also covered in detail."
)


def _generate_quiz(client, officer_id="OFF001"):
    """Call POST /api/quiz/generate and return the JSON body."""
    with patch("app.routers.quiz.generate_mcqs", side_effect=_mock_generate_mcqs):
        with patch("app.routers.quiz.get_cached", return_value=None):
            with patch("app.routers.quiz.set_cached"):
                resp = client.post(
                    "/api/quiz/generate",
                    files={"file": ("sample.txt", FIXTURE_FILE_CONTENT, "text/plain")},
                    data={
                        "difficulty": "medium",
                        "language": "en",
                        "num_questions": "3",
                        "officer_id": officer_id,
                    },
                )
    return resp


# ── Tests ────────────────────────────────────────────────────────────────────


class TestGenerateWithCompetencyTags:
    """Task 1 + Task 2: generate returns attempt_id and competency_tag per question."""

    def test_generate_returns_attempt_id_and_tags(self, client):
        resp = _generate_quiz(client)
        assert resp.status_code == 200
        body = resp.json()

        assert "attempt_id" in body
        assert isinstance(body["attempt_id"], str) and len(body["attempt_id"]) > 0

        assert "questions" in body
        assert len(body["questions"]) == 3

        for q in body["questions"]:
            assert "competency_tag" in q
            assert q["competency_tag"].startswith("CID-")
            # Existing fields still present (backwards compatibility)
            assert "question" in q
            assert "options" in q
            assert "correct" in q
            assert "explanation" in q

    def test_generate_creates_quiz_attempt_shell(self, client, db_session):
        resp = _generate_quiz(client)
        body = resp.json()
        attempt_id = body["attempt_id"]

        attempt = db_session.query(QuizAttempt).filter_by(attempt_id=attempt_id).first()
        assert attempt is not None
        assert attempt.officer_id == "OFF001"
        assert attempt.attempted_on is None  # Not yet submitted
        assert attempt.raw_score_percent is None

    def test_generate_creates_answer_key_rows(self, client, db_session):
        resp = _generate_quiz(client)
        body = resp.json()
        attempt_id = body["attempt_id"]

        generated = (
            db_session.query(QuizAttemptGenerated)
            .filter_by(attempt_id=attempt_id)
            .order_by(QuizAttemptGenerated.question_index.asc())
            .all()
        )
        assert len(generated) == 3
        assert generated[0].correct_index == 0
        assert generated[0].competency_tag == "CID-D-102"
        assert generated[1].competency_tag == "CID-D-104"

    def test_generate_404_for_unknown_officer(self, client):
        resp = client.post(
            "/api/quiz/generate",
            files={"file": ("sample.txt", FIXTURE_FILE_CONTENT, "text/plain")},
            data={
                "difficulty": "medium",
                "language": "en",
                "num_questions": "3",
                "officer_id": "OFF999",
            },
        )
        assert resp.status_code == 404


class TestSubmitQuiz:
    """Task 3 + Task 4: submit scores, writes CompetencyScore, handles edge cases."""

    def test_full_flow_correct_scoring(self, client, db_session):
        """Submit mix of correct/incorrect answers and verify scoring math."""
        gen_resp = _generate_quiz(client)
        body = gen_resp.json()
        attempt_id = body["attempt_id"]

        # Submit: Q0 correct (0), Q1 wrong (2 instead of 0), Q2 correct (0)
        submit_resp = client.post(
            "/api/quiz/submit",
            json={
                "attempt_id": attempt_id,
                "officer_id": "OFF001",
                "answers": [0, 2, 0],
            },
        )

        assert submit_resp.status_code == 200
        result = submit_resp.json()

        # ── Verify results array ────────────────────────────────────────
        assert result["attempt_id"] == attempt_id
        assert len(result["results"]) == 3

        assert result["results"][0]["is_correct"] is True
        assert result["results"][1]["is_correct"] is False
        assert result["results"][2]["is_correct"] is True

        # Correct answer indices revealed
        assert result["results"][0]["correct_option_index"] == 0
        assert result["results"][1]["correct_option_index"] == 0

        # ── Verify QuizAttemptQuestion rows ──────────────────────────────
        qa_rows = (
            db_session.query(QuizAttemptQuestion)
            .filter_by(attempt_id=attempt_id)
            .all()
        )
        assert len(qa_rows) == 3
        correct_count = sum(1 for r in qa_rows if r.is_correct)
        assert correct_count == 2

        # ── Verify CompetencyScore rows ──────────────────────────────────
        # CID-D-102 (Sampling): 2 questions, 2 correct → 100% → quiz_score = 5.0
        # CID-D-104 (Price Statistics): 1 question, 0 correct → 0% → quiz_score = 1.0
        scores = (
            db_session.query(CompetencyScore)
            .filter(CompetencyScore.source == f"quiz_attempt_{attempt_id}")
            .all()
        )
        score_by_cid = {s.cid: s for s in scores}

        assert "CID-D-102" in score_by_cid
        assert score_by_cid["CID-D-102"].quiz_score == 5.0
        assert score_by_cid["CID-D-102"].combined_score == 5.0  # no artifact_score

        assert "CID-D-104" in score_by_cid
        assert score_by_cid["CID-D-104"].quiz_score == 1.0

        # ── Verify score_summary in response ─────────────────────────────
        summary_by_cid = {s["cid"]: s for s in result["score_summary"]}
        assert summary_by_cid["CID-D-102"]["quiz_score"] == 5.0
        assert summary_by_cid["CID-D-104"]["quiz_score"] == 1.0

        # ── Verify QuizAttempt is marked as submitted ────────────────────
        attempt = db_session.query(QuizAttempt).filter_by(attempt_id=attempt_id).first()
        assert attempt.attempted_on is not None
        assert attempt.raw_score_percent is not None

    def test_double_submit_returns_409(self, client, db_session):
        """Task 4: double-submission should be rejected."""
        gen_resp = _generate_quiz(client)
        attempt_id = gen_resp.json()["attempt_id"]

        # First submit
        first = client.post(
            "/api/quiz/submit",
            json={"attempt_id": attempt_id, "officer_id": "OFF001", "answers": [0, 0, 0]},
        )
        assert first.status_code == 200

        # Second submit — should be 409
        second = client.post(
            "/api/quiz/submit",
            json={"attempt_id": attempt_id, "officer_id": "OFF001", "answers": [0, 0, 0]},
        )
        assert second.status_code == 409
        assert "already been submitted" in second.json()["detail"]

    def test_answer_count_mismatch_returns_422(self, client, db_session):
        """Task 4: wrong number of answers should be 422."""
        gen_resp = _generate_quiz(client)
        attempt_id = gen_resp.json()["attempt_id"]

        resp = client.post(
            "/api/quiz/submit",
            json={"attempt_id": attempt_id, "officer_id": "OFF001", "answers": [0, 0]},  # only 2 answers
        )
        assert resp.status_code == 422
        assert "Expected 3" in resp.json()["detail"]

    def test_wrong_officer_returns_400(self, client, db_session):
        """Submitting for a different officer_id should be 400."""
        gen_resp = _generate_quiz(client, officer_id="OFF001")
        attempt_id = gen_resp.json()["attempt_id"]

        resp = client.post(
            "/api/quiz/submit",
            json={"attempt_id": attempt_id, "officer_id": "OFF002", "answers": [0, 0, 0]},
        )
        assert resp.status_code == 400

    def test_unknown_attempt_returns_404(self, client):
        resp = client.post(
            "/api/quiz/submit",
            json={"attempt_id": "nonexistent-id", "officer_id": "OFF001", "answers": [0]},
        )
        assert resp.status_code == 404


class TestGapAnalysisReflectsSubmit:
    """Verify that gap-analysis endpoint reflects CompetencyScore written by quiz submit."""

    def test_gaps_use_evidence_based_score_after_submit(self, client, db_session):
        """
        After submitting a quiz with CID-D-102 (Sampling) questions answered
        correctly, the gap endpoint should show the new evidence-based score.
        """
        # Generate and submit — all correct
        gen_resp = _generate_quiz(client, officer_id="OFF001")
        attempt_id = gen_resp.json()["attempt_id"]

        client.post(
            "/api/quiz/submit",
            json={"attempt_id": attempt_id, "officer_id": "OFF001", "answers": [0, 0, 0]},
        )

        # Query gap analysis
        gaps_resp = client.get("/api/officers/OFF001/gaps")
        assert gaps_resp.status_code == 200
        gaps = gaps_resp.json()["gaps"]
        gap_skills = {g["skill"]: g for g in gaps}

        # CID-D-102 = "Sampling". OFF001's role R01 expects Sampling: 2.
        # If all CID-D-102 Qs are correct → quiz_score = 5.0, combined = 5.0
        # 5.0 >= 2 → "Sampling" should no longer appear as a gap (or appear
        # with evidence-based source).
        if "Sampling" in gap_skills:
            # If it still appears, it should use evidence-based source
            assert gap_skills["Sampling"]["score_source"] == "evidence-based"
        # If Sampling is NOT in gaps, that's correct: score 5.0 >= required 2

        # CID-D-104 = "Price Statistics". Not in R01's expected skills, so
        # we can't check it as a gap. But the CompetencyScore row should exist.
        cs = (
            db_session.query(CompetencyScore)
            .filter(
                CompetencyScore.officer_id == "OFF001",
                CompetencyScore.cid == "CID-D-104",
            )
            .first()
        )
        assert cs is not None
        assert cs.quiz_score == 5.0  # all correct for this tag too
