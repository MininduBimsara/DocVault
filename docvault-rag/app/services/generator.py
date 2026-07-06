"""
Generator: compiles RAG context and formats LLM prompt generation.
Implements async generation and query condensation for multi-turn conversations.
"""

import logging
from langchain_core.prompts import PromptTemplate

from app.core.gemini import generate_answer_async
from app.schemas.rag_chat import ChatHistoryItem
from app.services.retriever import RetrievedChunk

logger = logging.getLogger(__name__)

CONDENSE_PROMPT = PromptTemplate.from_template(
    """Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question (suitable for database retrieval) that contains all required context from the history.
Do NOT answer the question. Only output the rephrased standalone question. If the question does not need context or is already standalone, return it verbatim.

Conversation History:
{history_text}

Follow-up Question:
{question_text}

Standalone Question:"""
)


def _format_history(history: list[ChatHistoryItem]) -> str:
    if not history:
        return "(no previous messages)"

    # Format the last 10 messages
    recent = history[-10:]
    lines = [f"{item.role.upper()}: {item.content}" for item in recent]
    return "\n".join(lines)


def _format_context(chunks: list[RetrievedChunk]) -> str:
    blocks: list[str] = []
    for index, chunk in enumerate(chunks, start=1):
        header = (
            f"[Source {index}] docId={chunk.doc_id} "
            f"file={chunk.file_name} page={chunk.page if chunk.page is not None else 'unknown'} "
            f"chunkId={chunk.chunk_id}"
        )
        blocks.append(f"{header}\n{chunk.text.strip()}")

    return "\n\n".join(blocks)


async def condense_query(question: str, history: list[ChatHistoryItem]) -> str:
    """Condense multi-turn chat history and a follow-up question into a standalone query."""
    if not history:
        return question.strip()

    # Condense based on the last 6 messages to keep context tight and fast
    history_lines = [f"{item.role.upper()}: {item.content}" for item in history[-6:]]
    history_text = "\n".join(history_lines)

    prompt = CONDENSE_PROMPT.format(
        history_text=history_text,
        question_text=question
    )

    condensed = await generate_answer_async(prompt)
    cleaned = condensed.strip().strip('"').strip("'").strip()
    
    if cleaned:
        logger.info("[generator] condensed query: '%s' -> '%s'", question, cleaned)
        return cleaned
        
    return question.strip()


async def generate_context_only_answer(
    question: str,
    history: list[ChatHistoryItem],
    chunks: list[RetrievedChunk],
) -> str:
    """Generate a RAG answer asynchronously using only retrieved chunks."""
    template = PromptTemplate.from_template(
        """You are DocVault Assistant, a helpful AI helper.

Rules:
1) Answer the question strictly using the provided CONTEXT.
2) If the answer is not present in the CONTEXT, reply exactly:
   I couldn't find the answer in the selected documents.
3) Do not use outside knowledge or assume facts not present in CONTEXT.
4) Keep the answer concise, factual, and complete.
5) Cite supporting sources using markers like [Source 1], [Source 2] in the text matching the claims they back.

Conversation history:
{history_text}

Question:
{question_text}

CONTEXT:
{context_text}

Answer:""".strip()
    )

    prompt = template.format(
        history_text=_format_history(history),
        question_text=question,
        context_text=_format_context(chunks),
    )

    answer = await generate_answer_async(prompt)
    
    # CRITICAL: We do NOT call _normalize_whitespace here. 
    # Stripping whitespace collapses markdown layout structures (bullet lists, code blocks, tables).
    stripped = answer.strip()

    if not stripped:
        return "I couldn't find the answer in the selected documents."

    return stripped
