"""
Ingestion service — orchestrates the full pipeline:
Load PDF → Clean text → Chunk → Embed (Hugging Face) → Upsert (PGVector) → Notify
"""

import asyncio
import logging
import traceback
from typing import Any

from app.core.embeddings import embed_texts
from app.core.notify import post_progress
from app.core.pgvector_db import get_conn
from app.services.pdf_loader import load_pdf
from app.services.text_cleaner import build_page_filter, clean_text
from app.services.chunker import chunk_pages

logger = logging.getLogger(__name__)


async def _upsert_chunks(
    chunks: list[dict[str, Any]],
    all_vectors: list[list[float]],
    user_id: str,
    doc_id: str,
    file_name: str,
) -> None:
    """Asynchronously bulk upserts all chunks in a single multi-row query."""
    if not chunks:
        return

    values_parts = []
    params = []
    
    param_idx = 1
    for i, c in enumerate(chunks):
        chunk_id = f"{doc_id}_{c['page']}_{c['chunk_index']}"
        values_parts.append(
            f"(${param_idx}, ${param_idx+1}, ${param_idx+2}::vector, ${param_idx+3}, ${param_idx+4}, ${param_idx+5}, ${param_idx+6}, ${param_idx+7})"
        )
        params.extend([
            chunk_id,
            c["text"],
            all_vectors[i],  # list of floats, pgvector_db.py converts to string '[...]'
            user_id,
            doc_id,
            file_name,
            c["page"],
            c["chunk_index"]
        ])
        param_idx += 8

    values_sql = ", ".join(values_parts)
    sql = f"""
        INSERT INTO document_chunks
            (id, content, embedding, user_id, doc_id, file_name, page, chunk_index)
        VALUES {values_sql}
        ON CONFLICT (id) DO UPDATE SET
            content     = EXCLUDED.content,
            embedding   = EXCLUDED.embedding,
            file_name   = EXCLUDED.file_name
    """

    async with get_conn() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)


async def run_ingestion(
    user_id: str,
    doc_id: str,
    file_path: str,
    file_name: str,
) -> None:
    """
    Full ingestion pipeline for one document. Designed to run as a background task.
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
        # Skip batch delay for local sentence-transformers to speed up ingestion
        is_local_model = settings.HF_EMBEDDINGS_MODEL.startswith("sentence-transformers")
        delay_s = 0.0 if is_local_model else (settings.EMBED_BATCH_DELAY_MS / 1000.0)
        
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

            if delay_s > 0.0 and batch_start + batch_size < chunks_total:
                await asyncio.sleep(delay_s)

        # ── 5. Upsert to PGVector ─────────────────────────────────────────────
        await _upsert_chunks(chunks, all_vectors, user_id, doc_id, file_name)

        logger.info(
            "[ingest_service] upserted %d chunks to PGVector docId=%s",
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
        logger.error(
            "[ingest_service] FAILED docId=%s\n%s",
            doc_id,
            traceback.format_exc(),
        )

        short_msg = f"{type(exc).__name__}: {exc}"[:300]
        await post_progress(doc_id, {
            "stage": "failed",
            "status": "FAILED",
            "errorMessage": short_msg,
        })
