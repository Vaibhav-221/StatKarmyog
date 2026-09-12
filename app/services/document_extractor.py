"""
Document text extractor for the Quiz Generation Engine.

Extracts plain text from uploaded files (.pdf, .pptx, .docx, .txt, .md)
for downstream LLM processing. Enforces minimum content length and
truncates excessively long documents to control token cost.
"""

import logging
from pathlib import Path
import re

from fastapi import UploadFile

logger = logging.getLogger(__name__)

# Supported file extensions (lowercase, with dot)
SUPPORTED_EXTENSIONS = {".pdf", ".pptx", ".docx", ".txt", ".md"}

# Minimum extractable text length (characters)
MIN_TEXT_LENGTH = 200
PDF_MIN_TEXT_LENGTH = 40

# Maximum text length sent to the LLM (characters) — prototype cap to
# avoid excessive token cost.  ~12 000 chars ≈ ~3 000 tokens.
MAX_TEXT_LENGTH = 12_000


def _clean_text(text: str) -> str:
    """Normalize extracted text while preserving paragraph boundaries."""
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_pdf(content: bytes) -> str:
    """Extract text from a PDF file using pypdf."""
    from pypdf import PdfReader
    import io

    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as exc:
        raise ValueError("Invalid or corrupted PDF file.") from exc

    page_count = len(reader.pages)
    logger.info("[PDF] pages=%d size=%d", page_count, len(content))

    if reader.is_encrypted:
        raise ValueError("Could not extract readable text from this PDF. The file appears to be protected.")

    pages = []
    for index, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            logger.warning("[EXTRACTION] page=%d status=failed error=%s", index, exc)
            text = ""
        cleaned = _clean_text(text)
        logger.info("[EXTRACTION] page=%d characters_extracted=%d", index, len(cleaned))
        if cleaned:
            pages.append(f"[Page {index}]\n{cleaned}")

    extracted = _clean_text("\n\n".join(pages))
    logger.info(
        "[EXTRACTION] pages_processed=%d characters_extracted=%d text_preview=%r",
        page_count,
        len(extracted),
        extracted[:160],
    )
    return extracted


def _extract_pptx(content: bytes) -> str:
    """Extract text from all slides/shapes in a PowerPoint file."""
    from pptx import Presentation
    import io

    prs = Presentation(io.BytesIO(content))
    texts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        texts.append(text)
    return "\n\n".join(texts)


def _extract_docx(content: bytes) -> str:
    """Extract text from all paragraphs in a Word document."""
    from docx import Document
    import io

    doc = Document(io.BytesIO(content))
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)
    return "\n\n".join(paragraphs)


def _extract_plain(content: bytes) -> str:
    """Decode plain text content (UTF-8)."""
    return content.decode("utf-8", errors="replace")


# Dispatch table: extension -> extractor function
_EXTRACTORS = {
    ".pdf": _extract_pdf,
    ".pptx": _extract_pptx,
    ".docx": _extract_docx,
    ".txt": _extract_plain,
    ".md": _extract_plain,
}


async def extract_text(file: UploadFile) -> str:
    """
    Read the uploaded file and extract its text content.

    Raises
    ------
    ValueError
        If the file extension is unsupported or the extracted text is too
        short (< MIN_TEXT_LENGTH characters).

    Returns
    -------
    str
        The extracted (and possibly truncated) text.
    """
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()

    if ext not in _EXTRACTORS:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Accepted types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    await file.seek(0)
    content = await file.read()
    try:
        text = _EXTRACTORS[ext](content)
    except Exception as exc:
        if ext == ".pdf":
            raise ValueError("Could not extract readable text from this PDF.") from exc
        raise
    text = _clean_text(text)

    min_length = PDF_MIN_TEXT_LENGTH if ext == ".pdf" else MIN_TEXT_LENGTH
    if len(text) < min_length:
        if ext == ".pdf":
            raise ValueError(
                "Could not extract readable text from this PDF. "
                "The document may be scanned/image-based, protected, or too short."
            )
        raise ValueError(
            "Document has no extractable text (or text is too short — "
            f"need at least {min_length} characters, got {len(text)})."
        )

    if len(text) > MAX_TEXT_LENGTH:
        logger.warning(
            "Document text is %d chars — truncating to %d chars for LLM input.",
            len(text),
            MAX_TEXT_LENGTH,
        )
        text = text[:MAX_TEXT_LENGTH]

    return text
