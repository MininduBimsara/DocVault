import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

_http_client: httpx.AsyncClient | None = None


def get_notify_client() -> httpx.AsyncClient:
    """Get or initialize the global shared async HTTP client."""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=10.0)
    return _http_client


async def close_notify_client() -> None:
    """Close the global async HTTP client on application shutdown."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
        logger.info("[notify] global HTTP client closed.")


async def post_progress(doc_id: str, payload: dict) -> None:
    """
    POST {API_SERVICE_URL}/internal/docs/{doc_id}/progress

    Always includes the INTERNAL_RAG_KEY header.
    Swallows exceptions so callers never crash due to a webhook failure.
    """
    url = f"{settings.API_SERVICE_URL}/internal/docs/{doc_id}/progress"
    headers = {
        "Content-Type": "application/json",
        "INTERNAL_RAG_KEY": settings.INTERNAL_RAG_KEY,
    }

    try:
        client = get_notify_client()
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        logger.debug(
            "[notify] progress sent docId=%s stage=%s status=%s",
            doc_id,
            payload.get("stage"),
            payload.get("status"),
        )
    except Exception as exc:
        logger.warning(
            "[notify] failed to post progress docId=%s stage=%s: %s",
            doc_id,
            payload.get("stage"),
            exc,
        )
