"""
RAG chat service: orchestrates multi-turn query condensation,
asynchronous chunk retrieval, and context-bounded answer generation.
"""

from app.core.config import settings
from app.schemas.rag_chat import RagChatRequest, RagChatResponse, RagChatSource
from app.services.generator import condense_query, generate_context_only_answer
from app.services.retriever import retrieve_chunks


def _build_snippet(text: str, max_len: int = 160) -> str:
    compact = " ".join(text.split())
    if len(compact) <= max_len:
        return compact
    return f"{compact[: max_len - 1]}…"


def _dedupe_sources(chunks) -> list[RagChatSource]:
    seen: set[str] = set()
    sources: list[RagChatSource] = []

    for chunk in chunks:
        if chunk.chunk_id in seen:
            continue
        seen.add(chunk.chunk_id)
        sources.append(
            RagChatSource(
                docId=chunk.doc_id,
                fileName=chunk.file_name,
                page=chunk.page,
                chunkId=chunk.chunk_id,
                snippet=_build_snippet(chunk.text),
            )
        )

    return sources


async def run_rag_chat(request: RagChatRequest) -> RagChatResponse:
    """Orchestrates RAG chat processing asynchronously with query condensation."""
    if not request.docIds:
        return RagChatResponse(
            answer="I can’t answer because no documents are selected for this session.",
            sources=[],
        )

    # 1. Condense query if conversation history is present
    search_query = await condense_query(request.question, request.history)

    # 2. Retrieve relevant chunks asynchronously using the condensed query
    chunks = await retrieve_chunks(
        user_id=request.userId,
        doc_ids=request.docIds,
        query=search_query,
        top_k=settings.RETRIEVAL_TOP_K,
    )

    if not chunks:
        return RagChatResponse(
            answer="I couldn't find the answer in the selected documents.",
            sources=[],
        )

    # 3. Generate answer asynchronously using original question for instruction context
    answer = await generate_context_only_answer(
        question=request.question,
        history=request.history,
        chunks=chunks,
    )

    return RagChatResponse(
        answer=answer,
        sources=_dedupe_sources(chunks),
    )
