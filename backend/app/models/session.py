"""Chat session model (schema only – no routes in Phase 1)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SessionSchema(BaseModel):
    """Represents a chat session stored in MongoDB."""
    userId: str
    title: str
    selectedDocIds: list[str] = []
    createdAt: datetime
    updatedAt: datetime
