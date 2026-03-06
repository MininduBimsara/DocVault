from app.core.config import settings
from app.schemas.rag_chat import RagChatRequest, RagChatResponse, RagChatSource
from app.services.generator import generate_context_only_answer
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


def run_rag_chat(request: RagChatRequest) -> RagChatResponse:
    if not request.docIds:
        return RagChatResponse(
            answer="I can’t answer because no documents are selected for this session.",
            sources=[],
        )

    chunks = retrieve_chunks(
        user_id=request.userId,
        doc_ids=request.docIds,
        query=request.question,
        top_k=settings.RETRIEVAL_TOP_K,
    )

    if not chunks:
        return RagChatResponse(
            answer="I couldn't find the answer in the selected documents.",
            sources=[],
        )

    answer = generate_context_only_answer(
        question=request.question,
        history=request.history,
        chunks=chunks,
    )

    return RagChatResponse(
        answer=answer,
        sources=_dedupe_sources(chunks),
    )
