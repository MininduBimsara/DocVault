"""
POST /ingest — receives a document ingestion request from docvault-api.

Step 5 scope: validates input, responds immediately, then runs a
simulated ingestion pipeline in the background (no real embeddings yet).
Each stage posts a progress webhook back to Express via the express client.
"""

import asyncio
import logging
import pathlib

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

from app.core.config import settings
from app.clients.express import post_progress

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Internal auth dependency ──────────────────────────────────────────────────

_key_scheme = APIKeyHeader(name="INTERNAL_RAG_KEY", auto_error=False)


async def require_internal_key(api_key: str | None = Depends(_key_scheme)) -> None:
    """Dependency: rejects requests that don't carry the correct INTERNAL_RAG_KEY."""
    if not api_key or api_key != settings.INTERNAL_RAG_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing INTERNAL_RAG_KEY.")


# ── Request schema ────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    userId: str
    docId: str
    filePath: str
    fileName: str


# ── Simulated background pipeline ─────────────────────────────────────────────

async def _run_pipeline(doc_id: str, file_path: str) -> None:
    """
    Simulates the ingestion pipeline stages without real embeddings.
    Posts a progress webhook to Express at each stage.

    Step 6 will replace this with real PDF extraction + Chroma upsert.
    """
    stages = [
        ("extract", 1),
        ("chunk",   1),
        ("embed",   1),
        ("upsert",  1),
    ]

    try:
        logger.info("[ingest] pipeline started docId=%s", doc_id)

        for stage, delay in stages:
            await asyncio.sleep(delay)  # simulate work
            await post_progress(doc_id, {"stage": stage, "status": "PROCESSING"})
            logger.info("[ingest] stage=%s docId=%s", stage, doc_id)

        # All stages done — mark READY
        await post_progress(doc_id, {
            "stage": "done",
            "status": "READY",
        })
        logger.info("[ingest] pipeline complete docId=%s → READY", doc_id)

    except Exception as exc:
        logger.error("[ingest] pipeline error docId=%s: %s", doc_id, exc)
        await post_progress(doc_id, {
            "stage": "failed",
            "status": "FAILED",
            "errorMessage": str(exc),
        })


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", dependencies=[Depends(require_internal_key)])
async def ingest(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
):
    """
    Trigger document ingestion.

    Validates the internal key and that the file exists on disk,
    then responds immediately and runs the pipeline as a background task.
    """
    # Validate file exists
    path = pathlib.Path(body.filePath)
    if not path.exists():
        raise HTTPException(
            status_code=422,
            detail=f"File not found at path: {body.filePath}",
        )

    logger.info(
        "[ingest] request accepted docId=%s userId=%s file=%s",
        body.docId, body.userId, body.fileName,
    )

    # Queue background pipeline
    background_tasks.add_task(_run_pipeline, body.docId, body.filePath)

    return {"ok": True, "message": "ingestion started"}
