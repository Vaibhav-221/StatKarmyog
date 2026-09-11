"""
Tests for app/services/llm_provider.py

Verifies the response validation and malformed-question-dropping logic
WITHOUT making real LLM API calls.
"""

import json
import pytest
from unittest.mock import patch, MagicMock

from app.services.llm_provider import (
    _parse_llm_response,
    _validate_questions,
    _strip_markdown_fences,
    generate_mcqs,
)


# ── _strip_markdown_fences ───────────────────────────────────────────────────

def test_strip_fences_json_block():
    raw = '```json\n[{"q": 1}]\n```'
    assert _strip_markdown_fences(raw) == '[{"q": 1}]'


def test_strip_fences_plain_block():
    raw = '```\n[{"q": 1}]\n```'
    assert _strip_markdown_fences(raw) == '[{"q": 1}]'


def test_strip_fences_no_fences():
    raw = '[{"q": 1}]'
    assert _strip_markdown_fences(raw) == '[{"q": 1}]'


# ── _parse_llm_response ─────────────────────────────────────────────────────

def test_parse_valid_json():
    raw = json.dumps([{"question": "Q?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "E"}])
    result = _parse_llm_response(raw)
    assert len(result) == 1
    assert result[0]["question"] == "Q?"


def test_parse_fenced_json():
    inner = json.dumps([{"question": "Q?"}])
    raw = f"```json\n{inner}\n```"
    result = _parse_llm_response(raw)
    assert len(result) == 1


def test_parse_invalid_json_raises():
    with pytest.raises(ValueError, match="unparseable"):
        _parse_llm_response("This is not JSON at all")


# ── _validate_questions ──────────────────────────────────────────────────────

def _good_question(q="What is X?", correct=0):
    return {
        "question": q,
        "options": ["A", "B", "C", "D"],
        "correct": correct,
        "explanation": "Because A is correct.",
    }


def test_validate_keeps_good_questions():
    questions = [_good_question(), _good_question("Another?")]
    result = _validate_questions(questions)
    assert len(result) == 2


def test_validate_drops_missing_question_key():
    """Question dict missing the 'question' key should be dropped."""
    bad = {"options": ["A", "B", "C", "D"], "correct": 0, "explanation": "E"}
    result = _validate_questions([_good_question(), bad, _good_question()])
    assert len(result) == 2


def test_validate_drops_wrong_option_count():
    """Question with only 3 options should be dropped."""
    bad = _good_question()
    bad["options"] = ["A", "B", "C"]  # only 3
    result = _validate_questions([_good_question(), bad])
    assert len(result) == 1


def test_validate_drops_invalid_correct_index():
    """Question with correct=5 (out of range 0-3) should be dropped."""
    bad = _good_question()
    bad["correct"] = 5
    result = _validate_questions([_good_question(), bad])
    assert len(result) == 1


def test_validate_drops_missing_explanation():
    """Question with empty explanation should be dropped."""
    bad = _good_question()
    bad["explanation"] = ""
    result = _validate_questions([_good_question(), bad])
    assert len(result) == 1


def test_validate_drops_correct_as_string():
    """Question with correct as string instead of int should be dropped."""
    bad = _good_question()
    bad["correct"] = "0"  # string, not int
    result = _validate_questions([_good_question(), bad])
    assert len(result) == 1


# ── generate_mcqs (mocked LLM) ──────────────────────────────────────────────

def _mock_llm_response(questions: list[dict]) -> str:
    return json.dumps(questions)


def test_generate_mcqs_with_mocked_llm():
    """Verify generate_mcqs works end-to-end with a mocked LLM call."""
    good_questions = [_good_question(f"Question {i}?") for i in range(5)]
    mock_response = MagicMock()
    mock_response.content = _mock_llm_response(good_questions)

    with patch.dict("os.environ", {"GOOGLE_API_KEY": "test-key-123"}):
        with patch("app.services.llm_provider.ChatGoogleGenerativeAI") as MockLLM:
            # Make the chain (prompt | llm) return our mock response
            mock_llm_instance = MagicMock()
            MockLLM.return_value = mock_llm_instance
            # The pipe operator creates a RunnableSequence; mock its invoke
            with patch("app.services.llm_provider.PromptTemplate") as MockPrompt:
                mock_chain = MagicMock()
                mock_chain.invoke.return_value = mock_response
                mock_prompt_instance = MagicMock()
                MockPrompt.return_value = mock_prompt_instance
                mock_prompt_instance.__or__ = MagicMock(return_value=mock_chain)

                result = generate_mcqs(
                    text="Some sample text " * 50,
                    difficulty="medium",
                    language="en",
                    num_questions=5,
                )

    assert len(result) == 5
    for q in result:
        assert "question" in q
        assert len(q["options"]) == 4
        assert 0 <= q["correct"] <= 3


def test_generate_mcqs_raises_without_api_key():
    """Should raise ValueError when GOOGLE_API_KEY is not set."""
    with patch.dict("os.environ", {}, clear=True):
        # Also clear any existing GOOGLE_API_KEY
        import os
        env_backup = os.environ.get("GOOGLE_API_KEY")
        if "GOOGLE_API_KEY" in os.environ:
            del os.environ["GOOGLE_API_KEY"]
        try:
            with pytest.raises(ValueError, match="GOOGLE_API_KEY"):
                generate_mcqs("text " * 100, "easy", "en", 5)
        finally:
            if env_backup is not None:
                os.environ["GOOGLE_API_KEY"] = env_backup


def test_generate_mcqs_raises_when_too_few_valid():
    """Should raise ValueError when fewer than 3 valid questions remain."""
    # Only 2 good questions + 3 bad ones
    questions = [
        _good_question("Q1?"),
        _good_question("Q2?"),
        {"bad": "question"},
        {"also": "bad"},
        {"still": "bad"},
    ]
    mock_response = MagicMock()
    mock_response.content = json.dumps(questions)

    with patch.dict("os.environ", {"GOOGLE_API_KEY": "test-key-123"}):
        with patch("app.services.llm_provider.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm_instance = MagicMock()
            MockLLM.return_value = mock_llm_instance
            with patch("app.services.llm_provider.PromptTemplate") as MockPrompt:
                mock_chain = MagicMock()
                mock_chain.invoke.return_value = mock_response
                mock_prompt_instance = MagicMock()
                MockPrompt.return_value = mock_prompt_instance
                mock_prompt_instance.__or__ = MagicMock(return_value=mock_chain)

                with pytest.raises(ValueError, match="only 2 valid questions"):
                    generate_mcqs("text " * 100, "medium", "en", 5)
