"""
Ingest routes:
  POST   /ingest         — trigger PDF ingestion (runs as background task)
  DELETE /ingest/{docId} — delete all vector chunks for a document
"""

import logging
import os
import pathlib

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import require_internal_key
from app.core.pgvector_db import get_conn
from app.core.config import settings
from app.schemas.ingest import IngestRequest, IngestResponse
from app.services.ingest_service import run_ingestion

logger = logging.getLogger(__name__)

router = APIRouter()


class DeleteEmbeddingsResponse(BaseModel):
    ok: bool
    deletedChunks: int


# ── POST /ingest ───────────────────────────────────────────────────────────────

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
    - filePath resides strictly within FILE_STORAGE_PATH (Path Traversal Protection)
    - filePath ends with .pdf and the file exists on disk
    """
    if not body.userId or not body.docId or not body.fileName:
        raise HTTPException(
            status_code=422,
            detail="userId, docId, and fileName are required and must be non-empty.",
        )

    # ── Path Traversal Check ──────────────────────────────────────────────────
    # Resolve absolute paths and confirm file resides within the storage folder
    storage_dir = os.path.abspath(settings.FILE_STORAGE_PATH)
    file_path = os.path.abspath(body.filePath)

    try:
        common = os.path.commonpath([storage_dir, file_path])
        if common != storage_dir:
            raise ValueError("Path is outside storage directory boundaries.")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Security Violation: Target path is invalid or lies outside the storage boundary.",
        )

    path = pathlib.Path(file_path)

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

    logger.info(
        "[ingest] accepted docId=%s userId=%s file=%s",
        body.docId, body.userId, body.fileName,
    )

    background_tasks.add_task(
        run_ingestion,
        body.userId,
        body.docId,
        str(path),
        body.fileName,
    )

    return IngestResponse(ok=True, message="ingestion started")


# ── DELETE /ingest/{doc_id} ────────────────────────────────────────────────────

async def _delete_chunks_async(doc_id: str) -> int:
    """Delete all PGVector chunks for a document asynchronously."""
    async with get_conn() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM document_chunks WHERE doc_id = $1",
                (doc_id,),
            )
            deleted = cur.rowcount
    return deleted


@router.delete(
    "/{doc_id}",
    response_model=DeleteEmbeddingsResponse,
    dependencies=[Depends(require_internal_key)],
)
async def delete_embeddings(doc_id: str) -> DeleteEmbeddingsResponse:
    """
    Delete all vector chunks for a document from PGVector asynchronously.
    Called by the Express API whenever a document is deleted.
    """
    if not doc_id:
        raise HTTPException(status_code=422, detail="doc_id is required.")

    deleted = await _delete_chunks_async(doc_id)

    logger.info("[ingest] deleted %d chunks for docId=%s", deleted, doc_id)

    return DeleteEmbeddingsResponse(ok=True, deletedChunks=deleted)
