"""
Internal key security dependency.

Any route that requires a valid INTERNAL_RAG_KEY header should declare:
    dependencies=[Depends(require_internal_key)]
"""

from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

from app.core.config import settings

_key_scheme = APIKeyHeader(name="INTERNAL_RAG_KEY", auto_error=False)


async def require_internal_key(api_key: str | None = Depends(_key_scheme)) -> None:
    """Reject requests that don't carry the correct INTERNAL_RAG_KEY."""
    if not api_key or api_key != settings.INTERNAL_RAG_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing INTERNAL_RAG_KEY.")
