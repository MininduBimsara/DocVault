"""
Hugging Face embedding adapter for ingestion and retrieval.
"""

import asyncio
import importlib
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_model: Any | None = None


def _get_embedding_model() -> Any:
    global _embedding_model

    if _embedding_model is not None:
        return _embedding_model

    try:
        huggingface_module = importlib.import_module("langchain_huggingface")
        huggingface_embeddings_cls = getattr(huggingface_module, "HuggingFaceEmbeddings")
    except Exception as exc:
        raise RuntimeError(
            "Hugging Face embeddings require langchain-huggingface. "
            "Install with: pip install langchain-huggingface"
        ) from exc

    model_name = settings.HF_EMBEDDINGS_MODEL.strip()
    logger.info("[embeddings] loading Hugging Face model via LangChain: %s", model_name)
    _embedding_model = huggingface_embeddings_cls(
        model_name=model_name,
        encode_kwargs={"normalize_embeddings": True},
        model_kwargs={},
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


def embed_query(query: str) -> list[float]:
    return _embed_query_sync(query)
