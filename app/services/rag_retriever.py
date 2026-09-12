"""
RAG Retriever Service — SentenceTransformers + Vector Retrieval for Quiz Generation.

Extracts relevant grounding passages from uploaded document text for a target competency.
Uses sentence-transformers ('all-MiniLM-L6-v2') to compute embeddings and rank text chunks.
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_MODEL_NAME = "all-MiniLM-L6-v2"
_embedding_model: Any | None = None


def _get_embedding_model() -> Any:
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformer model '%s' for RAG...", _MODEL_NAME)
        _embedding_model = SentenceTransformer(_MODEL_NAME)
    return _embedding_model


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 120) -> list[str]:
    """
    Split text into overlapping chunks based on sentences/paragraphs.
    """
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end < len(text):
            # Try to break at sentence end or space
            break_pos = max(text.rfind('. ', start, end), text.rfind('\n', start, end))
            if break_pos > start + 100:
                end = break_pos + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap if end < len(text) else len(text)

    return chunks


def retrieve_relevant_context(text: str, target_competency: str | None = None, top_k: int = 5) -> str:
    """
    Given raw extracted text from a document, chunk it and use SentenceTransformer
    to retrieve the top_k passages most relevant to target_competency.

    If text is short or target_competency is not provided, returns full or truncated text.
    """
    if not text or len(text.strip()) == 0:
        return ""

    # If text is already small (< 1500 chars), return it as is
    if len(text) < 1500 or not target_competency:
        return text[:4000]

    chunks = chunk_text(text)
    if len(chunks) <= top_k:
        return "\n\n".join(chunks)

    try:
        model = _get_embedding_model()
        query_str = f"Statistical methods, concepts, guidelines, definitions and practices related to {target_competency}"

        # Compute embeddings for query and chunks
        chunk_embeddings = model.encode(chunks, show_progress_bar=False)
        query_embedding = model.encode([query_str], show_progress_bar=False)

        # Compute cosine similarities
        import numpy as np
        # Normalize vectors for cosine similarity
        chunk_norm = chunk_embeddings / (np.linalg.norm(chunk_embeddings, axis=1, keepdims=True) + 1e-10)
        query_norm = query_embedding / (np.linalg.norm(query_embedding, axis=1, keepdims=True) + 1e-10)
        
        similarities = np.dot(chunk_norm, query_norm.T).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        # Preserve original order of top chunks for coherent reading
        top_indices_sorted = sorted(top_indices)
        retrieved_chunks = [chunks[i] for i in top_indices_sorted]

        logger.info(
            "RAG Retrieval: selected %d of %d chunks for target_competency='%s'",
            len(retrieved_chunks), len(chunks), target_competency
        )

        return "\n\n".join(retrieved_chunks)
    except Exception as exc:
        logger.warning("RAG retrieval failed, falling back to top text slice: %s", exc)
        return text[:4000]
