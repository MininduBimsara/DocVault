"""Gemini chat wrapper via LangChain."""

import logging
from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_llm: ChatGoogleGenerativeAI | None = None


def _get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        # convert_system_message_to_human is set to False to support native Gemini System Instructions
        _llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_CHAT_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.0,
            convert_system_message_to_human=False,
        )
    return _llm


def _parse_content(content) -> str:
    if isinstance(content, str) and content.strip():
        return content.strip()

    if isinstance(content, list):
        merged = " ".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        ).strip()
        if merged:
            return merged
    return ""


def generate_answer(prompt: str) -> str:
    """Generate a non-streaming answer using the configured Gemini chat model (synchronous)."""
    try:
        response = _get_llm().invoke(prompt)
        parsed = _parse_content(response.content)
        return parsed if parsed else "I couldn't find the answer in the selected documents."
    except Exception as exc:
        logger.error("[gemini] Error calling model (sync): %s", exc)
        return "I couldn't find the answer in the selected documents."


async def generate_answer_async(prompt: str) -> str:
    """Generate a non-streaming answer using the configured Gemini chat model asynchronously."""
    try:
        response = await _get_llm().ainvoke(prompt)
        parsed = _parse_content(response.content)
        return parsed if parsed else "I couldn't find the answer in the selected documents."
    except Exception as exc:
        logger.error("[gemini] Error calling model (async): %s", exc)
        return "I couldn't find the answer in the selected documents."

