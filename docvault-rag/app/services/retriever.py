from dataclasses import dataclass

import numpy as np

from app.core.pgvector_db import get_conn
from app.core.embeddings import embed_query


@dataclass
class RetrievedChunk:
    text: str
    doc_id: str
    file_name: str
    page: int | None
    chunk_index: int | None
    chunk_id: str


def retrieve_chunks(
    user_id: str,
    doc_ids: list[str],
    query: str,
    top_k: int,
) -> list[RetrievedChunk]:
    if not doc_ids:
        return []

    query_vector = np.array(embed_query(query), dtype=np.float32)

    placeholders = ",".join(["%s"] * len(doc_ids))
    sql = f"""
        SELECT id, content, doc_id, file_name, page, chunk_index
        FROM document_chunks
        WHERE user_id = %s
          AND doc_id IN ({placeholders})
        ORDER BY embedding <=> %s
        LIMIT %s
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, *doc_ids, query_vector, top_k))
            rows = cur.fetchall()

    chunks: list[RetrievedChunk] = []
    for (chunk_id, content, doc_id, file_name, page, chunk_index) in rows:
        if not isinstance(content, str) or not content.strip():
            continue
        if doc_id not in doc_ids:
            continue

        chunks.append(
            RetrievedChunk(
                text=content,
                doc_id=doc_id,
                file_name=file_name,
                page=page,
                chunk_index=chunk_index,
                chunk_id=chunk_id,
            )
        )

    return chunks
