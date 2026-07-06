"""
PGVector database client — HTTP-based connection proxy for Neon DB Serverless.
Fully asynchronous, parameterized, and secure.
"""

import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

VECTOR_DIM = 384

def get_neon_api_url(postgres_url: str) -> str:
    """Resolve the pooled endpoint to Neon's parameter-supporting api gateway."""
    if "@" in postgres_url:
        host_part = postgres_url.split("@")[-1].split("/")[0].split("?")[0]
    else:
        host_part = postgres_url.split("/")[-1].split("?")[0]
        
    parts = host_part.split(".")
    if parts[0].startswith("ep-"):
        parts[0] = "api"
    host = ".".join(parts)
    return f"https://{host}/sql"


_db_client: httpx.AsyncClient | None = None


def get_db_client() -> httpx.AsyncClient:
    """Initialize or fetch the global persistent async client for database querying."""
    global _db_client
    if _db_client is None:
        _db_client = httpx.AsyncClient(timeout=30.0)
    return _db_client


async def close_db_client() -> None:
    """Close the global database client connection pool."""
    global _db_client
    if _db_client is not None:
        await _db_client.aclose()
        _db_client = None
        logger.info("[pgvector_db] global DB client connection closed.")


class HTTPCursor:
    def __init__(self, connection):
        self.connection = connection
        self.rows = []
        self.rowcount = 0

    async def execute(self, sql: str, params: list | tuple | None = None) -> None:
        """Execute a parameterized query asynchronously over Neon's HTTP SQL gateway."""
        logger.debug("[HTTP SQL] Executing query: %s", sql[:200])
        headers = {
            "Neon-Connection-String": self.connection.dsn,
            "Neon-Raw-Text-Output": "true",
            "Neon-Array-Mode": "true",
        }
        
        # Prepare parameters list (convert lists / arrays to text representation for Postgres parsing)
        serialized_params = []
        if params is not None:
            if not isinstance(params, (list, tuple)):
                params = (params,)
            for p in params:
                if isinstance(p, (list, tuple)):
                    serialized_params.append(str(list(p)))
                elif hasattr(p, "tolist"):  # Matches numpy arrays
                    serialized_params.append(str(p.tolist()))
                else:
                    serialized_params.append(p)

        payload = {
            "query": sql,
            "params": serialized_params,
        }
        
        client = get_db_client()
        response = await client.post(self.connection.url, json=payload, headers=headers)
        if response.status_code != 200:
            raise RuntimeError(f"Database query failed: {response.text}")
            
        data = response.json()
        
        # Parse fields and rows
        fields = [f["name"] for f in data.get("fields", [])]
        raw_rows = data.get("rows", [])
        
        self.rows = []
        for row in raw_rows:
            # When Neon-Array-Mode is true, rows are arrays matching the order of fields
            if isinstance(row, list):
                self.rows.append(tuple(row))
            elif isinstance(row, dict):
                self.rows.append(tuple(row.get(f) for f in fields))
            else:
                self.rows.append((row,))
            
        self.rowcount = data.get("rowCount", 0)

    def fetchall(self) -> list[tuple]:
        return self.rows

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


class HTTPConnection:
    def __init__(self, url: str, dsn: str):
        self.url = url
        self.dsn = dsn

    def cursor(self) -> HTTPCursor:
        return HTTPCursor(self)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


def get_conn() -> HTTPConnection:
    """Return a connection proxy yielding an HTTP Neon connection."""
    url = get_neon_api_url(settings.POSTGRES_URL)
    return HTTPConnection(url, settings.POSTGRES_URL)


async def init_db() -> None:
    """
    Create the pgvector extension, chunks table, and indices if they don't
    exist. Called once at FastAPI startup.
    """
    async with get_conn() as conn:
        async with conn.cursor() as cur:
            await cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

            await cur.execute(f"""
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

            await cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_user_doc "
                "ON document_chunks (user_id, doc_id)"
            )

            await cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_hnsw "
                "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
            )

    logger.info("[pgvector] database ready via Neon HTTP SQL API (async)")
