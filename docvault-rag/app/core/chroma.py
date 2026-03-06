"""
Chroma persistent client — singleton pattern.

Call `get_collection()` anywhere in the app to get the shared
`docvault_chunks` collection. The client is created once and reused.
"""

import logging
import chromadb

from app.core.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "docvault_chunks"

_client: chromadb.PersistentClient | None = None


def get_chroma_client() -> chromadb.PersistentClient:
    """Return (or initialise) the shared Chroma persistent client."""
    global _client
    if _client is None:
        logger.info("[chroma] initialising PersistentClient at %s", settings.CHROMA_PATH)
        _client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    return _client


def get_collection() -> chromadb.Collection:
    """Return (or create) the docvault_chunks collection."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return collection
