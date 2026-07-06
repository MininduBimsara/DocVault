"""
Retriever: retrieves relevant text chunks from PGVector database.
Filters by user, document list, and similarity threshold.
"""

from dataclasses import dataclass
import numpy as np

from app.core.config import settings
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


async def retrieve_chunks(
    user_id: str,
    doc_ids: list[str],
    query: str,
    top_k: int,
) -> list[RetrievedChunk]:
    """
    Retrieve matching document chunks from the vector database asynchronously.
    Only returns chunks whose cosine similarity meets settings.SIMILARITY_THRESHOLD.
    """
    if not doc_ids:
        return []

    # Get query embedding asynchronously
    raw_vector = await embed_query(query)
    query_vector = np.array(raw_vector, dtype=np.float32)

    # Build parameterized SQL query
    param_idx = 1
    user_id_param = f"${param_idx}"
    param_idx += 1

    doc_placeholders = []
    for _ in doc_ids:
        doc_placeholders.append(f"${param_idx}")
        param_idx += 1
    doc_list_sql = ", ".join(doc_placeholders)

    vector_param = f"${param_idx}"
    param_idx += 1

    threshold_param = f"${param_idx}"
    param_idx += 1

    limit_param = f"${param_idx}"

    # cosine distance <= (1 - cosine similarity threshold)
    max_distance = float(1.0 - settings.SIMILARITY_THRESHOLD)

    sql = f"""
        SELECT id, content, doc_id, file_name, page, chunk_index, (embedding <=> {vector_param}::vector) as distance
        FROM document_chunks
        WHERE user_id = {user_id_param}
          AND doc_id IN ({doc_list_sql})
          AND (embedding <=> {vector_param}::vector) <= {threshold_param}
        ORDER BY distance ASC
        LIMIT {limit_param}
    """

    params = [
        user_id,
        *doc_ids,
        query_vector,
        max_distance,
        top_k
    ]

    async with get_conn() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            rows = cur.fetchall()

    chunks: list[RetrievedChunk] = []
    for row in rows:
        # Avoid tuple unpacking errors if fields count varies, match exactly by select statement indexes
        chunk_id = row[0]
        content = row[1]
        doc_id = row[2]
        file_name = row[3]
        page = row[4]
        chunk_index = row[5]

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
