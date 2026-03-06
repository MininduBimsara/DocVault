"""Gemini chat wrapper via LangChain."""

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import settings

_llm: ChatGoogleGenerativeAI | None = None


def _get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_CHAT_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0,
            convert_system_message_to_human=True,
        )
    return _llm


def generate_answer(prompt: str) -> str:
    """Generate a non-streaming answer using the configured Gemini chat model."""
    response = _get_llm().invoke(prompt)
    content = response.content

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

    return "I couldn't find the answer in the selected documents."
