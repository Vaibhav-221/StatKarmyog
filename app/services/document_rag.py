"""
Uploaded-document RAG helpers for quiz generation.

This module keeps the quiz endpoint focused on request validation while reusing
the existing Sentence-Transformer dependency for document chunk embeddings.
"""

from __future__ import annotations

import re
import uuid
import logging
from typing import Any

from app.services.semantic_search import _get_embedding_model

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1600
CHUNK_OVERLAP = 250
TOP_K_CHUNKS = 6


class _LazyChroma:
    def EphemeralClient(self):
        import chromadb

        return chromadb.EphemeralClient()


chromadb: Any = _LazyChroma()


def _as_plain_list(vectors):
    """Convert numpy/torch encoder output or test doubles into plain lists."""
    return vectors.tolist() if hasattr(vectors, "tolist") else vectors


def clean_extracted_text(text: str) -> str:
    """Normalize extracted document text without inventing or rewriting content."""
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks suitable for embedding and retrieval."""
    cleaned = clean_extracted_text(text)
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        window = cleaned[start:end]

        if end < len(cleaned):
            split_at = max(window.rfind("\n\n"), window.rfind(". "), window.rfind(" "))
            if split_at > chunk_size // 2:
                end = start + split_at + 1
                window = cleaned[start:end]

        chunk = window.strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(cleaned):
            break
        start = max(0, end - overlap)

    return chunks


def _build_query(cleaned: str, target_competency: str | None) -> str:
    focus = target_competency or "professional statistical training assessment"
    return (
        "Find the most assessment-worthy uploaded-document passages for "
        f"{focus}. Include definitions, procedures, methods, examples, tables, "
        "quality checks, and decision rules.\n\n"
        + cleaned[:2000]
    )


def retrieve_relevant_context(
    text: str,
    *,
    source: str = "uploaded-document",
    target_competency: str | None = None,
    num_chunks: int = TOP_K_CHUNKS,
) -> dict:
    """
    Build an ephemeral vector index for the uploaded document and retrieve
    the most representative chunks for Gemini.
    """
    cleaned = clean_extracted_text(text)
    chunks = chunk_text(cleaned)
    logger.info("[CHUNKING] source=%s chunks_created=%d", source, len(chunks))
    if not chunks:
        raise ValueError("No chunks generated from uploaded document.")

    try:
        model = _get_embedding_model()
        embeddings = _as_plain_list(model.encode(chunks, show_progress_bar=False))
    except ModuleNotFoundError as exc:
        logger.exception("[EMBEDDING] dependency_missing source=%s", source)
        raise ValueError(
            "Backend PDF RAG dependency is missing. Install sentence-transformers and redeploy the backend."
        ) from exc
    except Exception as exc:
        logger.exception("[EMBEDDING] status=failed source=%s", source)
        raise ValueError("Embedding generation failed for uploaded document.") from exc

    if len(embeddings) != len(chunks):
        logger.error("[EMBEDDING] status=invalid chunks=%d embeddings=%d", len(chunks), len(embeddings))
        raise ValueError("Embedding generation returned an invalid number of vectors.")

    logger.info(
        "[EMBEDDING] model=all-MiniLM-L6-v2 embeddings_created=%d",
        len(embeddings),
    )

    collection_name = f"quiz_pdf_{uuid.uuid4().hex}"
    try:
        client = chromadb.EphemeralClient()
        collection = client.create_collection(name=collection_name)
        ids = [f"chunk-{idx}" for idx in range(len(chunks))]
        metadatas = [{"source": source, "chunk_index": idx} for idx in range(len(chunks))]
        collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
    except ModuleNotFoundError as exc:
        logger.exception("[CHROMADB] dependency_missing collection_name=%s", collection_name)
        raise ValueError(
            "Backend vector-store dependency is missing. Install chromadb and redeploy the backend."
        ) from exc
    except Exception as exc:
        logger.exception("[CHROMADB] status=failed collection_name=%s", collection_name)
        raise ValueError("Vector store insertion failed for uploaded document.") from exc

    logger.info(
        "[CHROMADB] documents_added=%d collection_name=%s",
        len(chunks),
        collection_name,
    )

    query_text = _build_query(cleaned, target_competency)
    try:
        query_embedding = _as_plain_list(model.encode([query_text], show_progress_bar=False))
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(num_chunks, len(chunks)),
            include=["documents", "metadatas"],
        )
    except Exception as exc:
        logger.exception("[RETRIEVAL] status=failed source=%s", source)
        raise ValueError("No relevant context retrieved from uploaded document.") from exc

    retrieved = results.get("documents", [[]])[0]
    context = "\n\n".join(doc for doc in retrieved if doc)
    logger.info(
        "[RETRIEVAL] query=%r results_count=%d",
        query_text[:160],
        len([doc for doc in retrieved if doc]),
    )
    if not context.strip():
        raise ValueError("No relevant context retrieved from uploaded document.")

    return {
        "context": context,
        "chunk_count": len(chunks),
        "retrieved_chunk_count": len(retrieved),
        "collection_name": collection_name,
    }
