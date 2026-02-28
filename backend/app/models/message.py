"""Message model (schema only – no routes in Phase 1)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageSchema(BaseModel):
    """Represents a message stored in MongoDB."""
    userId: str
    sessionId: str
    role: MessageRole
    content: str
    createdAt: datetime
