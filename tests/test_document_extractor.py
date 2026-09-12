"""
Tests for app/services/document_extractor.py

Verifies text extraction from .txt files, minimum-length rejection,
and truncation of excessively long documents.
"""

import io
import asyncio
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from app.services.document_extractor import (
    extract_text,
    MIN_TEXT_LENGTH,
    PDF_MIN_TEXT_LENGTH,
    MAX_TEXT_LENGTH,
    SUPPORTED_EXTENSIONS,
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_upload_file(content: str | bytes, filename: str):
    """Create a mock UploadFile that behaves like a real one."""
    if isinstance(content, str):
        content = content.encode("utf-8")

    mock = AsyncMock()
    mock.filename = filename
    mock.read = AsyncMock(return_value=content)
    return mock


FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ── Tests ────────────────────────────────────────────────────────────────────

def test_extract_text_from_txt_fixture():
    """Extract text from the sample_doc.txt fixture file."""
    fixture_path = FIXTURES_DIR / "sample_doc.txt"
    content = fixture_path.read_bytes()
    upload = _make_upload_file(content, "sample_doc.txt")

    text = asyncio.run(extract_text(upload))

    assert isinstance(text, str)
    assert len(text) >= MIN_TEXT_LENGTH
    assert "Sampling" in text
    assert "probability" in text.lower()


def test_extract_text_from_md():
    """Extract text from a .md file (same code path as .txt)."""
    content = "# Heading\n\n" + "This is a test document with enough content. " * 20
    upload = _make_upload_file(content, "notes.md")

    text = asyncio.run(extract_text(upload))

    assert "Heading" in text
    assert len(text) >= MIN_TEXT_LENGTH


def test_extract_text_from_short_valid_pdf():
    """Short but readable text PDFs should not be treated as scanned PDFs."""
    fixture_path = FIXTURES_DIR / "sample_sampling_guidelines.pdf"
    content = fixture_path.read_bytes()
    upload = _make_upload_file(content, "sample_sampling_guidelines.pdf")

    text = asyncio.run(extract_text(upload))

    assert len(text) >= PDF_MIN_TEXT_LENGTH
    assert "Stratified Sampling" in text


def test_reject_too_short_text():
    """Documents with < MIN_TEXT_LENGTH chars should raise ValueError."""
    upload = _make_upload_file("Short.", "tiny.txt")

    with pytest.raises(ValueError, match="no extractable text"):
        asyncio.run(extract_text(upload))


def test_reject_empty_file():
    """Empty files should raise ValueError."""
    upload = _make_upload_file("", "empty.txt")

    with pytest.raises(ValueError, match="no extractable text"):
        asyncio.run(extract_text(upload))


def test_truncate_long_text():
    """Documents longer than MAX_TEXT_LENGTH should be truncated."""
    long_content = "A" * (MAX_TEXT_LENGTH + 5000)
    upload = _make_upload_file(long_content, "long.txt")

    text = asyncio.run(extract_text(upload))

    assert len(text) == MAX_TEXT_LENGTH


def test_reject_unsupported_extension():
    """Unsupported file types should raise ValueError."""
    upload = _make_upload_file("some content " * 50, "data.xlsx")

    with pytest.raises(ValueError, match="Unsupported file type"):
        asyncio.run(extract_text(upload))
