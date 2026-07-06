"""
Hugging Face embedding adapter for ingestion and retrieval.
"""

import asyncio
import importlib
import logging
from typing import Any

from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_model: HuggingFaceEmbeddings | None = None


def _get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model

    if _embedding_model is not None:
        return _embedding_model

    model_name = settings.HF_EMBEDDINGS_MODEL.strip()
    logger.info("[embeddings] loading Hugging Face model via LangChain: %s on device: %s", model_name, settings.EMBEDDING_DEVICE)
    _embedding_model = HuggingFaceEmbeddings(
        model_name=model_name,
        encode_kwargs={"normalize_embeddings": True},
        model_kwargs={"device": settings.EMBEDDING_DEVICE},
    )
    return _embedding_model


def _embed_texts_sync(texts: list[str]) -> list[list[float]]:
    model = _get_embedding_model()
    return model.embed_documents(texts)


def _embed_query_sync(query: str) -> list[float]:
    model = _get_embedding_model()
    return model.embed_query(query)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    return await asyncio.get_event_loop().run_in_executor(None, _embed_texts_sync, texts)


async def embed_query(query: str) -> list[float]:
    if not query:
        return []
    return await asyncio.get_event_loop().run_in_executor(None, _embed_query_sync, query)
