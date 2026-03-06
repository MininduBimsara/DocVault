from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("content must be non-empty")
        return trimmed


class RagChatRequest(BaseModel):
    userId: str = Field(min_length=1)
    docIds: list[str] = Field(default_factory=list)
    history: list[ChatHistoryItem] = Field(default_factory=list)
    question: str = Field(min_length=1)

    @field_validator("userId", "question")
    @classmethod
    def trim_required(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("value must be non-empty")
        return trimmed

    @field_validator("docIds")
    @classmethod
    def normalize_doc_ids(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            trimmed = value.strip()
            if trimmed:
                cleaned.append(trimmed)

        deduped = list(dict.fromkeys(cleaned))
        return deduped


class RagChatSource(BaseModel):
    docId: str
    fileName: str
    page: int | None = None
    chunkId: str
    snippet: str | None = None


class RagChatResponse(BaseModel):
    answer: str
    sources: list[RagChatSource]
