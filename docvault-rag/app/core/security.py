"""
Internal key security dependency.

Any route that requires a valid INTERNAL_RAG_KEY header should declare:
    dependencies=[Depends(require_internal_key)]
"""

import logging
import secrets
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

from app.core.config import settings

logger = logging.getLogger(__name__)

_key_scheme = APIKeyHeader(name="INTERNAL_RAG_KEY", auto_error=False)


async def require_internal_key(api_key: str | None = Depends(_key_scheme)) -> None:
    """Reject requests that don't carry the correct INTERNAL_RAG_KEY."""
    # Ensure key is secure at runtime (not empty and not default)
    cfg_key = settings.INTERNAL_RAG_KEY.strip()
    if not cfg_key:
        raise HTTPException(
            status_code=500,
            detail="Server Misconfiguration: INTERNAL_RAG_KEY is empty."
        )

    if cfg_key == "change_me_shared_secret_sudda":
        logger.warning("WARNING: Running with default developer key. Change INTERNAL_RAG_KEY in production!")

    if not api_key or not secrets.compare_digest(api_key, cfg_key):
        raise HTTPException(status_code=401, detail="Invalid or missing INTERNAL_RAG_KEY.")
