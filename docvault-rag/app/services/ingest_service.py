"""
Ingestion service — orchestrates the full pipeline:

    Load PDF → Clean text → Chunk → Embed (Hugging Face) → Upsert (Chroma) → Notify

Progress is reported to Express at each major stage via the notify module.
All errors are caught and reported as FAILED so the pipeline never silently dies.
"""

import asyncio
import logging
import traceback

from app.core.chroma import get_collection
from app.core.embeddings import embed_texts
from app.core.notify import post_progress
from app.services.pdf_loader import load_pdf
from app.services.text_cleaner import build_page_filter, clean_text
from app.services.chunker import chunk_pages

logger = logging.getLogger(__name__)


async def run_ingestion(
    user_id: str,
    doc_id: str,
    file_path: str,
    file_name: str,
) -> None:
    """
    Full ingestion pipeline for one document. Designed to run as a background task.

    Stages:
      1. Load PDF pages via PyMuPDF
      2. Clean each page (whitespace, page numbers, repeated headers)
      3. Chunk pages → notify Express {stage=chunk}
      4. Embed chunks in batches → notify Express {stage=embed} after each batch
      5. Upsert to Chroma with deterministic IDs {docId}_{page}_{chunkIndex}
      6. Notify Express {stage=done, status=READY}

    On any exception:
      → Log full traceback locally
      → Notify Express {stage=failed, status=FAILED, errorMessage=...}
    """
    logger.info(
        "[ingest_service] START docId=%s userId=%s file=%s",
        doc_id, user_id, file_name,
    )

    try:
        # ── 1. Load PDF ───────────────────────────────────────────────────────
        pages = load_pdf(file_path)

        if not pages:
            raise ValueError(
                f"No usable pages extracted from '{file_name}'. "
                "The PDF may be empty, image-only, or entirely below MIN_PAGE_CHARS."
            )

        # ── 2. Clean text ─────────────────────────────────────────────────────
        repeated_lines = build_page_filter(pages)
        cleaned_pages = [
            {"page": p["page"], "text": clean_text(p["text"], repeated_lines)}
            for p in pages
        ]

        # ── 3. Chunk ──────────────────────────────────────────────────────────
        chunks = chunk_pages(cleaned_pages)
        chunks_total = len(chunks)

        if chunks_total == 0:
            raise ValueError(
                f"Chunking produced 0 chunks for '{file_name}'. "
                "The document may have no extractable text after cleaning."
            )

        logger.info("[ingest_service] %d chunks produced docId=%s", chunks_total, doc_id)

        await post_progress(doc_id, {
            "stage": "chunk",
            "chunksTotal": chunks_total,
            "chunksDone": 0,
            "status": "PROCESSING",
        })

        # ── 4. Embed in batches ───────────────────────────────────────────────
        from app.core.config import settings

        batch_size = settings.EMBED_BATCH_SIZE
        delay_s = settings.EMBED_BATCH_DELAY_MS / 1000.0
        all_vectors: list[list[float]] = []
        chunks_done = 0

        for batch_start in range(0, chunks_total, batch_size):
            batch_chunks = chunks[batch_start : batch_start + batch_size]
            batch_texts = [c["text"] for c in batch_chunks]

            vectors = await embed_texts(batch_texts)
            all_vectors.extend(vectors)

            chunks_done += len(batch_chunks)

            await post_progress(doc_id, {
                "stage": "embed",
                "chunksTotal": chunks_total,
                "chunksDone": chunks_done,
                "status": "PROCESSING",
            })

            logger.debug(
                "[ingest_service] embedded batch %d→%d (%d/%d) docId=%s",
                batch_start, batch_start + len(batch_chunks),
                chunks_done, chunks_total, doc_id,
            )

            # Small delay between batches for ingest-level pacing.
            if batch_start + batch_size < chunks_total:
                await asyncio.sleep(delay_s)

        # ── 5. Upsert to Chroma ───────────────────────────────────────────────
        collection = get_collection()

        ids = [
            f"{doc_id}_{c['page']}_{c['chunk_index']}"
            for c in chunks
        ]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "userId": user_id,
                "docId": doc_id,
                "fileName": file_name,
                "page": c["page"],
                "chunkIndex": c["chunk_index"],
            }
            for c in chunks
        ]

        # upsert is idempotent: same IDs → overwrite, new IDs → insert
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=all_vectors,
            metadatas=metadatas,
        )

        logger.info(
            "[ingest_service] upserted %d chunks to Chroma docId=%s",
            chunks_total, doc_id,
        )

        # ── 6. Notify READY ───────────────────────────────────────────────────
        await post_progress(doc_id, {
            "stage": "done",
            "chunksTotal": chunks_total,
            "chunksDone": chunks_total,
            "status": "READY",
        })

        logger.info("[ingest_service] DONE docId=%s → READY", doc_id)

    except Exception as exc:
        # Log the full traceback locally for debugging
        logger.error(
            "[ingest_service] FAILED docId=%s\n%s",
            doc_id,
            traceback.format_exc(),
        )

        # Report failure to Express
        short_msg = f"{type(exc).__name__}: {exc}"[:300]
        await post_progress(doc_id, {
            "stage": "failed",
            "status": "FAILED",
            "errorMessage": short_msg,
        })
