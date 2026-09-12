"""
Semantic Search Service — ChromaDB + sentence-transformers for course embeddings.

Provides:
  - build_course_index()  — one-time embedding build (idempotent)
  - query_similar_courses() — query the vector index for semantically similar courses
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

import chromadb

from app.models.models import CourseCatalogue

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

_MODEL_NAME = "all-MiniLM-L6-v2"
_COLLECTION_NAME = "courses"
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", _PROJECT_ROOT / "data"))
CHROMA_PATH = Path(os.environ.get("CHROMA_PATH", DATA_DIR / "chroma"))

# Module-level singletons (initialised lazily)
_chroma_client: chromadb.PersistentClient | None = None
_embedding_model: Any | None = None


def _get_chroma_client() -> chromadb.PersistentClient:
    """Return (or create) the persistent ChromaDB client."""
    global _chroma_client
    if _chroma_client is None:
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return _chroma_client


def _get_embedding_model() -> Any:
    """Return (or download/load) the sentence-transformer model lazily."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformer model '%s' ...", _MODEL_NAME)
        _embedding_model = SentenceTransformer(_MODEL_NAME)
    return _embedding_model


def _course_to_text(course: CourseCatalogue) -> str:
    """
    Build the embedding text string for a course, combining title + category +
    skill_tags for maximum semantic signal.
    """
    tags_str = ", ".join(course.skill_tags or [])
    return f"{course.course_title}. {course.category}. Tags: {tags_str}"


# ── Index Build ──────────────────────────────────────────────────────────────

def build_course_index(db: "Session") -> int:
    """
    Embed every course from CourseCatalogue and store in ChromaDB.

    Idempotent: skips if the collection already exists and the document count
    matches the course count in the DB.

    Returns the number of courses indexed (0 if skipped).
    """
    client = _get_chroma_client()
    courses: list[CourseCatalogue] = db.query(CourseCatalogue).all()
    course_count = len(courses)

    # Check if collection already exists and is fully populated
    existing_collections = [c.name for c in client.list_collections()]
    if _COLLECTION_NAME in existing_collections:
        collection = client.get_collection(_COLLECTION_NAME)
        if collection.count() == course_count:
            logger.info(
                "[OK] ChromaDB collection '%s' already has %d documents -- skipping index build.",
                _COLLECTION_NAME,
                course_count,
            )
            return 0

        # Course count mismatch — rebuild
        logger.info(
            "Course count mismatch (DB=%d, index=%d). Rebuilding index...",
            course_count,
            collection.count(),
        )
        client.delete_collection(_COLLECTION_NAME)

    # Build fresh index
    logger.info("Building semantic index for %d courses ...", course_count)
    t0 = time.time()

    model = _get_embedding_model()
    collection = client.create_collection(name=_COLLECTION_NAME)

    # Prepare batch data
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for course in courses:
        doc_text = _course_to_text(course)
        ids.append(course.course_id)
        documents.append(doc_text)
        metadatas.append({
            "course_title": course.course_title,
            "category": course.category,
            "skill_tags": ",".join(course.skill_tags or []),
        })

    # Embed all at once (much faster than one-by-one)
    embeddings = model.encode(documents, show_progress_bar=False).tolist()

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    elapsed = time.time() - t0
    logger.info(
        "[OK] Indexed %d courses in %.2fs (collection='%s').",
        course_count,
        elapsed,
        _COLLECTION_NAME,
    )
    return course_count


# ── Query ────────────────────────────────────────────────────────────────────

def query_similar_courses(
    query_text: str,
    n_results: int = 10,
) -> list[dict]:
    """
    Query ChromaDB for the top-n_results courses most semantically similar
    to the given query text.

    Returns a list of dicts: {course_id, course_title, category, skill_tags,
    semantic_distance} sorted by distance ascending (most similar first).
    """
    client = _get_chroma_client()
    collection = client.get_collection(_COLLECTION_NAME)
    model = _get_embedding_model()

    query_embedding = model.encode([query_text], show_progress_bar=False).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(n_results, collection.count()),
        include=["metadatas", "distances"],
    )

    courses: list[dict] = []
    for i, course_id in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        tags_raw = meta.get("skill_tags", "")
        skill_tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

        courses.append({
            "course_id": course_id,
            "course_title": meta["course_title"],
            "category": meta["category"],
            "skill_tags": skill_tags,
            "semantic_distance": distance,
        })

    return courses


def get_collection_count() -> int:
    """Return the number of documents in the courses collection (for tests)."""
    client = _get_chroma_client()
    try:
        collection = client.get_collection(_COLLECTION_NAME)
        return collection.count()
    except Exception:
        return 0
