"""Document model (schema only – no routes in Phase 1)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class DocumentSchema(BaseModel):
    """Represents a document stored in MongoDB."""
    userId: str
    fileName: str
    status: DocumentStatus = DocumentStatus.UPLOADED
    progress: int = Field(default=0, ge=0, le=100)
    createdAt: datetime
