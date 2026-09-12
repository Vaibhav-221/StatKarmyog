from unittest.mock import patch

import pytest

from app.services.document_rag import chunk_text, retrieve_relevant_context


class FakeEmbeddingModel:
    def encode(self, documents, show_progress_bar=False):
        return [[float(index + 1), 0.5] for index, _ in enumerate(documents)]


class FakeCollection:
    def __init__(self):
        self.added = {}

    def add(self, ids, documents, embeddings, metadatas):
        self.added = {
            "ids": ids,
            "documents": documents,
            "embeddings": embeddings,
            "metadatas": metadatas,
        }

    def query(self, query_embeddings, n_results, include):
        return {
            "documents": [self.added["documents"][:n_results]],
            "metadatas": [self.added["metadatas"][:n_results]],
        }


class FakeChromaClient:
    def __init__(self, collection):
        self.collection = collection

    def create_collection(self, name):
        return self.collection


def test_chunk_text_omits_empty_chunks():
    chunks = chunk_text(" \n\n ".join(["Sampling frame and stratification."] * 120))
    assert chunks
    assert all(chunk.strip() for chunk in chunks)


def test_retrieve_relevant_context_embeds_adds_and_queries_chunks():
    collection = FakeCollection()
    text = "Sampling frame and stratification improve survey estimates. " * 140

    with patch("app.services.document_rag._get_embedding_model", return_value=FakeEmbeddingModel()):
        with patch("app.services.document_rag.chromadb.EphemeralClient", return_value=FakeChromaClient(collection)):
            result = retrieve_relevant_context(
                text,
                source="sampling.pdf",
                target_competency="Sampling",
                num_chunks=2,
            )

    assert result["chunk_count"] >= 2
    assert result["retrieved_chunk_count"] == 2
    assert result["context"]
    assert len(collection.added["documents"]) == result["chunk_count"]
    assert collection.added["metadatas"][0]["source"] == "sampling.pdf"


def test_retrieve_relevant_context_rejects_empty_text():
    with pytest.raises(ValueError, match="No chunks generated"):
        retrieve_relevant_context("   ", source="empty.pdf")


def test_retrieve_relevant_context_rejects_zero_retrieval():
    class EmptyCollection(FakeCollection):
        def query(self, query_embeddings, n_results, include):
            return {"documents": [[]], "metadatas": [[]]}

    with patch("app.services.document_rag._get_embedding_model", return_value=FakeEmbeddingModel()):
        with patch("app.services.document_rag.chromadb.EphemeralClient", return_value=FakeChromaClient(EmptyCollection())):
            with pytest.raises(ValueError, match="No relevant context retrieved"):
                retrieve_relevant_context("Data quality validation. " * 140, source="empty-results.pdf")
