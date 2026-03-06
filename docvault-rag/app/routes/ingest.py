"""
POST /ingest — Step 6: real ingestion pipeline.

Validates the request, then hands off to ingest_service as a BackgroundTask
so the endpoint returns immediately while processing continues asynchronously.
"""

import logging
import pathlib

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.core.security import require_internal_key
from app.schemas.ingest import IngestRequest, IngestResponse
from app.services.ingest_service import run_ingestion

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=IngestResponse, dependencies=[Depends(require_internal_key)])
async def ingest(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
) -> IngestResponse:
    """
    Trigger document ingestion.

    Validates:
    - INTERNAL_RAG_KEY header (via dependency)
    - userId, docId, fileName are non-empty
    - filePath ends with .pdf and the file exists on disk

    Returns immediately with {"ok": true, "message": "ingestion started"}.
    The real pipeline runs in the background.
    """
    # ── Input validation ──────────────────────────────────────────────────────
    if not body.userId or not body.docId or not body.fileName:
        raise HTTPException(
            status_code=422,
            detail="userId, docId, and fileName are required and must be non-empty.",
        )

    path = pathlib.Path(body.filePath)

    if path.suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=422,
            detail=f"filePath must end with .pdf, got: {body.filePath}",
        )

    if not path.exists():
        raise HTTPException(
            status_code=422,
            detail=f"File not found at path: {body.filePath}",
        )

    # ── Accept and queue ──────────────────────────────────────────────────────
    logger.info(
        "[ingest] accepted docId=%s userId=%s file=%s",
        body.docId, body.userId, body.fileName,
    )

    background_tasks.add_task(
        run_ingestion,
        body.userId,
        body.docId,
        body.filePath,
        body.fileName,
    )

    return IngestResponse(ok=True, message="ingestion started")
