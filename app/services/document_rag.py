"""
Uploaded-document RAG helpers for quiz generation.

This module keeps the quiz endpoint focused on request validation while reusing
the existing Sentence-Transformer dependency for document chunk embeddings.
"""

from __future__ import annotations

import re
import uuid

import chromadb

from app.services.semantic_search import _get_embedding_model

CHUNK_SIZE = 1600
CHUNK_OVERLAP = 250
TOP_K_CHUNKS = 6


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


def retrieve_relevant_context(
    text: str,
    *,
    num_chunks: int = TOP_K_CHUNKS,
) -> dict:
    """
    Build an ephemeral vector index for the uploaded document and retrieve
    the most representative chunks for Gemini.
    """
    cleaned = clean_extracted_text(text)
    chunks = chunk_text(cleaned)
    if not chunks:
        raise ValueError("Could not extract readable text from this document.")

    if len(chunks) <= num_chunks:
        return {
            "context": "\n\n".join(chunks),
            "chunk_count": len(chunks),
            "retrieved_chunk_count": len(chunks),
        }

    model = _get_embedding_model()
    embeddings = model.encode(chunks, show_progress_bar=False).tolist()

    client = chromadb.EphemeralClient()
    collection = client.create_collection(name=f"quiz_pdf_{uuid.uuid4().hex}")
    ids = [f"chunk-{idx}" for idx in range(len(chunks))]
    collection.add(ids=ids, documents=chunks, embeddings=embeddings)

    query_text = (
        "Key concepts, definitions, procedures, methods, examples, and assessment-worthy "
        "content from this uploaded training document.\n\n"
        + cleaned[:2000]
    )
    query_embedding = model.encode([query_text], show_progress_bar=False).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(num_chunks, len(chunks)),
        include=["documents"],
    )

    retrieved = results.get("documents", [[]])[0]
    context = "\n\n".join(doc for doc in retrieved if doc)
    if not context.strip():
        raise ValueError("Could not retrieve relevant text from this document.")

    return {
        "context": context,
        "chunk_count": len(chunks),
        "retrieved_chunk_count": len(retrieved),
    }
