"""
LLM provider abstraction for MCQ generation.

Wraps the LLM call behind a single function so the underlying model
(currently Google Gemini via LangChain) can be swapped for Azure OpenAI,
a self-hosted model, or any other provider without touching the router
or any other code.

Environment variable required:
    GOOGLE_API_KEY — your Google AI Studio / Gemini API key.
"""

import json
import logging
import os
import re

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

load_dotenv()

logger = logging.getLogger(__name__)

# ── Prompt Template ──────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an expert item-writer for professional training assessments used by \
government statistical agencies. Your task is to generate high-quality \
multiple-choice questions (MCQs) for statistical officers.

{target_competency_instruction}

RULES:
1. Generate exactly {num_questions} questions.
2. Difficulty level: {difficulty_description}
3. Language: {language_instruction}
4. Each question MUST have exactly 4 options.
5. The "correct" field must be the 0-based index (0, 1, 2, or 3) of the \
correct option.
6. Provide a brief explanation for why the correct answer is right.
7. For each question, you MUST assign a "competency_tag" — the competency ID \
(CID) from the COMPETENCY DICTIONARY below that this question most closely \
tests. You MUST pick exactly one CID from the list; do NOT invent new CIDs.
8. Return ONLY a valid JSON array — no markdown fences, no preamble, no \
trailing text. The output must be parseable by json.loads() directly.

COMPETENCY DICTIONARY (pick competency_tag from these CIDs only):
{competency_list}

OUTPUT SCHEMA (strict):
[
  {{
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct": 0,
    "explanation": "string",
    "competency_tag": "CID-X-NNN"
  }}
]

SOURCE / DOMAIN CONTEXT TEXT:
{text}
"""

_DIFFICULTY_DESCRIPTIONS = {
    "easy": "Easy — recall and definition level. Questions should test basic "
            "factual recall, terminology, and simple definitions from the text.",
    "medium": "Medium — application level. Questions should test the ability "
              "to apply concepts, interpret scenarios, or compare approaches "
              "described in the text.",
    "hard": "Hard — analysis and scenario level. Questions should require "
            "multi-step reasoning, evaluating trade-offs, or analysing "
            "realistic scenarios based on the text.",
}

_LANGUAGE_INSTRUCTIONS = {
    "en": "Write all questions, options, and explanations in English.",
    "hi": "Write ALL questions, options, AND explanations in Hindi (हिन्दी). "
          "Use Devanagari script throughout.",
}


# ── JSON parsing helpers ─────────────────────────────────────────────────────

def _strip_markdown_fences(raw: str) -> str:
    """Remove ```json ... ``` fences that LLMs sometimes add."""
    raw = raw.strip()
    # Remove leading ```json or ``` and trailing ```
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _parse_llm_response(raw: str) -> list[dict]:
    """
    Parse the raw LLM string into a Python list of dicts.

    Tries direct JSON parse first; if that fails, strips markdown fences
    and retries once.
    """
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        cleaned = _strip_markdown_fences(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"LLM returned unparseable output. First 500 chars: {raw[:500]}"
            ) from exc


def _validate_questions(
    questions: list[dict],
    valid_cids: set[str] | None = None,
) -> list[dict]:
    """
    Keep only well-formed question dicts. A valid question has:
    - "question" (str)
    - "options" (list of exactly 4 strings)
    - "correct" (int 0-3)
    - "explanation" (str)
    - "competency_tag" (str, must be in valid_cids if provided)
    """
    valid = []
    for i, q in enumerate(questions):
        try:
            assert isinstance(q.get("question"), str) and q["question"].strip()
            assert isinstance(q.get("options"), list) and len(q["options"]) == 4
            assert all(isinstance(o, str) and o.strip() for o in q["options"])
            assert isinstance(q.get("correct"), int) and 0 <= q["correct"] <= 3
            assert isinstance(q.get("explanation"), str) and q["explanation"].strip()
            # Phase 4B: validate competency_tag against CompetencyDictionary
            if valid_cids is not None:
                assert isinstance(q.get("competency_tag"), str) and q["competency_tag"].strip()
                if q["competency_tag"] not in valid_cids:
                    logger.warning(
                        "Dropping question at index %d: competency_tag '%s' not in CompetencyDictionary",
                        i, q.get("competency_tag"),
                    )
                    continue
            valid.append(q)
        except (AssertionError, KeyError, TypeError):
            logger.warning("Dropping malformed question at index %d: %s", i, q)
    return valid


# ── Public API ───────────────────────────────────────────────────────────────

def generate_mcqs(
    text: str,
    difficulty: str,
    language: str,
    num_questions: int = 10,
    valid_competencies: list[dict] | None = None,
    target_competency: str | None = None,
) -> list[dict]:
    """
    Generate MCQs from *text* using Google Gemini via LangChain.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is not set. "
            "Please set it to your Google AI Studio API key."
        )

    difficulty_description = _DIFFICULTY_DESCRIPTIONS.get(difficulty, _DIFFICULTY_DESCRIPTIONS["medium"])
    language_instruction = _LANGUAGE_INSTRUCTIONS.get(language, _LANGUAGE_INSTRUCTIONS["en"])

    # Build competency list string for the prompt
    target_cid = None
    if valid_competencies:
        competency_list = "\n".join(
            f"- {c['cid']}: {c['label']}" for c in valid_competencies
        )
        valid_cids = {c["cid"] for c in valid_competencies}
        if target_competency:
            for c in valid_competencies:
                if c['label'].lower() == target_competency.lower() or c['cid'] == target_competency:
                    target_cid = c['cid']
                    break
    else:
        competency_list = "(No competency dictionary provided)"
        valid_cids = None

    if target_competency:
        cid_clause = f" ({target_cid})" if target_cid else ""
        target_competency_instruction = (
            f"PRIMARY TARGET COMPETENCY FOCUS:\n"
            f"All or most questions MUST specifically assess knowledge, concepts, principles, and applications "
            f"related to '{target_competency}'{cid_clause}. Ensure questions focus on this competency topic."
        )
    else:
        target_competency_instruction = ""

    prompt = PromptTemplate(
        input_variables=[
            "text", "num_questions", "difficulty_description", "language_instruction",
            "competency_list", "target_competency_instruction"
        ],
        template=_SYSTEM_PROMPT,
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.3,
    )

    chain = prompt | llm

    logger.info(
        "Calling Gemini: target_competency=%s, difficulty=%s, language=%s, num_questions=%d, text_len=%d",
        target_competency, difficulty, language, num_questions, len(text),
    )

    response = chain.invoke({
        "text": text,
        "num_questions": num_questions,
        "difficulty_description": difficulty_description,
        "language_instruction": language_instruction,
        "competency_list": competency_list,
        "target_competency_instruction": target_competency_instruction,
    })

    raw_content = response.content if hasattr(response, "content") else str(response)
    questions = _parse_llm_response(raw_content)
    valid_questions = _validate_questions(questions, valid_cids=valid_cids)

    if len(valid_questions) < 3:
        raise ValueError(
            f"LLM produced only {len(valid_questions)} valid questions "
            f"(minimum 3 required). Raw output had {len(questions)} items."
        )

    logger.info(
        "Generated %d valid questions (of %d raw).",
        len(valid_questions), len(questions),
    )

    return valid_questions
