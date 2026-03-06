from dataclasses import dataclass

from langchain_chroma import Chroma

from app.core.chroma import COLLECTION_NAME, get_chroma_client
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

    vector_store = Chroma(
        client=get_chroma_client(),
        collection_name=COLLECTION_NAME,
        embedding_function=None,
    )
    query_vector = embed_query(query)

    where_filter: dict[str, object] = {
        "$and": [
            {"userId": user_id},
            {"docId": {"$in": doc_ids}},
        ]
    }

    docs = vector_store.similarity_search_by_vector(
        embedding=query_vector,
        k=top_k,
        filter=where_filter,
    )

    chunks: list[RetrievedChunk] = []

    for doc in docs:
        text = doc.page_content
        metadata = doc.metadata

        if not isinstance(text, str) or not text.strip():
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
