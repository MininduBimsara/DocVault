"""
Embedding provider abstraction for ingestion and retrieval.

Supports:
- Gemini (`EMBEDDINGS_PROVIDER=gemini`)
- Hugging Face local sentence-transformers (`EMBEDDINGS_PROVIDER=huggingface`)
"""

import asyncio
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_hf_model = None
_hf_model_name_loaded: str | None = None


def _is_hf_provider() -> bool:
    return settings.EMBEDDINGS_PROVIDER.strip().lower() in {"huggingface", "hf"}


def _get_hf_model():
    global _hf_model, _hf_model_name_loaded

    model_name = settings.HF_EMBEDDINGS_MODEL.strip()
    if _hf_model is not None and _hf_model_name_loaded == model_name:
        return _hf_model

    try:
        from sentence_transformers import SentenceTransformer
    except Exception as exc:
        raise RuntimeError(
            "Hugging Face embeddings require sentence-transformers. "
            "Install with: pip install sentence-transformers"
        ) from exc

    logger.info("[embeddings] loading Hugging Face model: %s", model_name)
    _hf_model = SentenceTransformer(model_name)
    _hf_model_name_loaded = model_name
    return _hf_model


def _hf_embed_sync(texts: list[str]) -> list[list[float]]:
    model = _get_hf_model()
    vectors = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        batch_size=settings.EMBED_BATCH_SIZE,
        show_progress_bar=False,
    )
    return vectors.tolist()


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    if _is_hf_provider():
        return await asyncio.get_event_loop().run_in_executor(None, _hf_embed_sync, texts)

    from app.core.gemini import embed_texts as gemini_embed_texts

    return await gemini_embed_texts(texts)


def embed_query(query: str) -> list[float]:
    if _is_hf_provider():
        vectors = _hf_embed_sync([query])
        return vectors[0]

    from app.core.gemini import embed_query as gemini_embed_query

    return gemini_embed_query(query)
