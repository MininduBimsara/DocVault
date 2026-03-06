from dataclasses import dataclass

from app.core.chroma import get_collection
from app.core.embeddings import embed_query


@dataclass
class RetrievedChunk:
    text: str
    doc_id: str
    file_name: str
    page: int | None
    chunk_index: int | None
    chunk_id: str


def _build_chunk_id(doc_id: str, page: int | None, chunk_index: int | None) -> str:
    page_value = page if page is not None else 0
    chunk_value = chunk_index if chunk_index is not None else 0
    return f"{doc_id}_{page_value}_{chunk_value}"


def _to_int(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    return None


def retrieve_chunks(
    user_id: str,
    doc_ids: list[str],
    query: str,
    top_k: int,
) -> list[RetrievedChunk]:
    if not doc_ids:
        return []

    collection = get_collection()
    query_vector = embed_query(query)

    where_filter: dict[str, object] = {
        "$and": [
            {"userId": user_id},
            {"docId": {"$in": doc_ids}},
        ]
    }

    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas"],
    )

    documents_rows = results.get("documents") or []
    metadatas_rows = results.get("metadatas") or []

    if not documents_rows or not metadatas_rows:
        return []

    documents = documents_rows[0] if isinstance(documents_rows[0], list) else []
    metadatas = metadatas_rows[0] if isinstance(metadatas_rows[0], list) else []

    chunks: list[RetrievedChunk] = []

    for text, metadata in zip(documents, metadatas):
        if not isinstance(text, str):
            continue
        if not isinstance(metadata, dict):
            continue

        meta_user_id = metadata.get("userId")
        meta_doc_id = metadata.get("docId")
        file_name = metadata.get("fileName")

        if meta_user_id != user_id:
            continue
        if not isinstance(meta_doc_id, str) or meta_doc_id not in doc_ids:
            continue
        if not isinstance(file_name, str) or not file_name.strip():
            continue

        page = _to_int(metadata.get("page"))
        chunk_index = _to_int(metadata.get("chunkIndex"))
        chunk_id = _build_chunk_id(meta_doc_id, page, chunk_index)

        chunks.append(
            RetrievedChunk(
                text=text,
                doc_id=meta_doc_id,
                file_name=file_name,
                page=page,
                chunk_index=chunk_index,
                chunk_id=chunk_id,
            )
        )

    return chunks
