from app.core.gemini import generate_answer
from app.schemas.rag_chat import ChatHistoryItem
from app.services.retriever import RetrievedChunk


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.split())


def _format_history(history: list[ChatHistoryItem]) -> str:
    if not history:
        return "(no previous messages)"

    recent = history[-10:]
    lines = [f"- {item.role}: {item.content}" for item in recent]
    return "\n".join(lines)


def _format_context(chunks: list[RetrievedChunk]) -> str:
    blocks: list[str] = []

    for index, chunk in enumerate(chunks, start=1):
        header = (
            f"[Source {index}] docId={chunk.doc_id} "
            f"file={chunk.file_name} page={chunk.page if chunk.page is not None else 'unknown'} "
            f"chunkId={chunk.chunk_id}"
        )
        blocks.append(f"{header}\n{chunk.text}")

    return "\n\n".join(blocks)


def generate_context_only_answer(
    question: str,
    history: list[ChatHistoryItem],
    chunks: list[RetrievedChunk],
) -> str:
    prompt = f"""
You are DocVault Assistant.

Rules:
1) Answer ONLY from the provided CONTEXT.
2) If the answer is not present in CONTEXT, reply exactly:
   I couldn't find the answer in the selected documents.
3) Do not use outside knowledge.
4) Keep the answer concise and factual.
5) When possible, mention supporting source markers like [Source 1], [Source 2].

Conversation history:
{_format_history(history)}

Question:
{question}

CONTEXT:
{_format_context(chunks)}
""".strip()

    answer = generate_answer(prompt)
    normalized = _normalize_whitespace(answer)

    if not normalized:
        return "I couldn't find the answer in the selected documents."

    return normalized
