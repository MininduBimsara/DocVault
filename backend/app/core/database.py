"""MongoDB connection management using Motor (async driver)."""

from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Open the Motor client and select the database."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DB_NAME]
    logger.info("Connected to MongoDB: %s / %s", settings.MONGODB_URI, settings.MONGODB_DB_NAME)


async def close_db() -> None:
    """Cleanly close the Motor client."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Return the database instance (must be called after connect_db)."""
    if _db is None:
        raise RuntimeError("Database not initialised – call connect_db() first.")
    return _db


async def ensure_indexes() -> None:
    """Create required indexes (idempotent)."""
    db = get_db()

    # users – unique email
    await db.users.create_index("email", unique=True)

    # documents – lookup by owner
    await db.documents.create_index("userId")

    # sessions – lookup by owner
    await db.sessions.create_index("userId")

    # messages – lookup by owner and by session
    await db.messages.create_index("userId")
    await db.messages.create_index("sessionId")

    # query_logs – lookup by owner and by session
    await db.query_logs.create_index("userId")
    await db.query_logs.create_index("sessionId")

    logger.info("MongoDB indexes ensured.")
