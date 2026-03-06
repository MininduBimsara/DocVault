"""
Gemini embedding wrapper.

Embeds texts in configurable batches using google-generativeai.
Includes exponential back-off for rate-limit errors (up to 3 retries).
"""

import asyncio
import logging

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure the SDK once when the module is imported
genai.configure(api_key=settings.GEMINI_API_KEY)


def _embed_batch_sync(texts: list[str]) -> list[list[float]]:
    """
    Synchronous call to Gemini embed_content for a single batch.
    Returns a list of embedding vectors (one per text).
    """
    result = genai.embed_content(
        model=settings.EMBEDDINGS_MODEL,
        content=texts,
        task_type="RETRIEVAL_DOCUMENT",
    )
    # result["embedding"] is a list of vectors when content is a list
    return result["embedding"]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts in batches, with retry and inter-batch delay.

    Returns a flat list of vectors in the same order as input texts.
    Raises RuntimeError if a batch fails after all retries.
    """
    batch_size = settings.EMBED_BATCH_SIZE
    delay_s = settings.EMBED_BATCH_DELAY_MS / 1000.0
    all_vectors: list[list[float]] = []

    for batch_start in range(0, len(texts), batch_size):
        batch = texts[batch_start : batch_start + batch_size]
        batch_num = batch_start // batch_size + 1

        # Exponential back-off retry (up to 3 attempts)
        last_exc: Exception | None = None
        for attempt in range(1, 4):
            try:
                logger.debug(
                    "[gemini] embedding batch %d (size=%d, attempt=%d)",
                    batch_num, len(batch), attempt,
                )
                # Run synchronous SDK call in a thread pool to avoid blocking
                vectors = await asyncio.get_event_loop().run_in_executor(
                    None, _embed_batch_sync, batch
                )
                all_vectors.extend(vectors)
                last_exc = None
                break  # success
            except Exception as exc:
                last_exc = exc
                wait = 2 ** attempt  # 2s, 4s, 8s
                logger.warning(
                    "[gemini] batch %d attempt %d failed (%s). Retrying in %ds…",
                    batch_num, attempt, exc, wait,
                )
                await asyncio.sleep(wait)

        if last_exc is not None:
            raise RuntimeError(
                f"Embedding batch {batch_num} failed after 3 retries: {last_exc}"
            )

        # Small delay between batches to stay under rate limits
        if batch_start + batch_size < len(texts):
            await asyncio.sleep(delay_s)

    return all_vectors


def embed_query(query: str) -> list[float]:
    """Embed one retrieval query using Gemini RETRIEVAL_QUERY mode."""
    result = genai.embed_content(
        model=settings.EMBEDDINGS_MODEL,
        content=query,
        task_type="RETRIEVAL_QUERY",
    )
    return result["embedding"]


def generate_answer(prompt: str) -> str:
    """Generate a non-streaming answer using the configured Gemini chat model."""
    model = genai.GenerativeModel(model_name=settings.GEMINI_CHAT_MODEL)
    result = model.generate_content(prompt)

    text = getattr(result, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    return "I couldn't find the answer in the selected documents."
