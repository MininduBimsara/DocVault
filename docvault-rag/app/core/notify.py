"""
Progress webhook client — posts status updates back to the Express API.

Non-fatal by design: failures are logged as warnings, never raised, so
the ingestion pipeline keeps running regardless of network issues.
"""

import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def post_progress(doc_id: str, payload: dict) -> None:
    """
    POST {API_SERVICE_URL}/internal/docs/{doc_id}/progress

    Always includes the INTERNAL_RAG_KEY header.
    Swallows exceptions so callers never crash due to a webhook failure.

    Example payloads:
        After chunking  : {stage, chunksTotal, chunksDone=0, status="PROCESSING"}
        After each batch: {stage, chunksTotal, chunksDone=N, status="PROCESSING"}
        On completion   : {stage="done", chunksTotal, chunksDone=total, status="READY"}
        On failure      : {stage="failed", status="FAILED", errorMessage="..."}
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
