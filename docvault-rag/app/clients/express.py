"""
Webhook client — posts progress updates back to the Express API.
"""

import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def post_progress(doc_id: str, payload: dict) -> None:
    """
    Call POST {API_SERVICE_URL}/internal/docs/{doc_id}/progress
    with the INTERNAL_RAG_KEY header.

    Logs a warning on failure but never raises — progress updates are
    best-effort; the ingestion pipeline must continue regardless.
    """
    url = f"{settings.API_SERVICE_URL}/internal/docs/{doc_id}/progress"
    headers = {
        "Content-Type": "application/json",
        "INTERNAL_RAG_KEY": settings.INTERNAL_RAG_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.debug(
                "[express.client] progress posted docId=%s stage=%s status=%s",
                doc_id,
                payload.get("stage"),
                payload.get("status"),
            )
    except Exception as exc:
        # Non-fatal — log and continue
        logger.warning(
            "[express.client] failed to post progress docId=%s: %s",
            doc_id,
            exc,
        )
