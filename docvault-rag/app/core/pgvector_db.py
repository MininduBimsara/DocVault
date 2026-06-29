"""
PGVector database client — connection pool and DDL initialization.

Replaces ChromaDB. Stores chunk embeddings in PostgreSQL using the pgvector
extension. Vectors are 384-dimensional (sentence-transformers/all-MiniLM-L6-v2).
"""

import logging
import psycopg2
import psycopg2.pool
from pgvector.psycopg2 import register_vector

from app.core.config import settings

logger = logging.getLogger(__name__)

VECTOR_DIM = 384

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        # Log host/db only, never the password
        safe_dsn = settings.POSTGRES_URL.split("@")[-1] if "@" in settings.POSTGRES_URL else settings.POSTGRES_URL
        logger.info("[pgvector] initializing connection pool → %s", safe_dsn)
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.POSTGRES_URL,
        )
    return _pool


class _ManagedConn:
    """Borrow/return a connection from the pool and register the pgvector codec."""

    def __enter__(self):
        self._conn = _get_pool().getconn()
        register_vector(self._conn)
        return self._conn

    def __exit__(self, exc_type, *_):
        if exc_type is not None:
            self._conn.rollback()
        _get_pool().putconn(self._conn)


def get_conn() -> _ManagedConn:
    """Return a context manager yielding a pooled psycopg2 connection."""
    return _ManagedConn()


def init_db() -> None:
    """
    Create the pgvector extension, chunks table, and indices if they don't
    exist. Called once at FastAPI startup — safe to re-run (all DDL is IF NOT EXISTS).
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Enable the pgvector extension (requires PostgreSQL superuser or pg_extension privilege)
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id          TEXT PRIMARY KEY,
                    content     TEXT        NOT NULL,
                    embedding   vector({VECTOR_DIM}) NOT NULL,
                    user_id     TEXT        NOT NULL,
                    doc_id      TEXT        NOT NULL,
                    file_name   TEXT        NOT NULL,
                    page        INTEGER     NOT NULL,
                    chunk_index INTEGER     NOT NULL,
                    created_at  TIMESTAMPTZ DEFAULT NOW()
                )
            """)

            # B-tree index for fast filtering by user_id + doc_id before the ANN scan
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_user_doc "
                "ON document_chunks (user_id, doc_id)"
            )

            # HNSW index for approximate nearest-neighbour search with cosine distance
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_hnsw "
                "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
            )

        conn.commit()

    logger.info("[pgvector] database ready — table and indices exist")
