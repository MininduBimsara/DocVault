"""Query log model (schema only – no routes in Phase 1)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class QueryLogSchema(BaseModel):
    """Represents a query log entry stored in MongoDB."""
    userId: str
    sessionId: str
    query: str
    retrievedChunkIds: list[str] = []
    latency: float = 0.0
    tokens: int = 0
    createdAt: datetime
