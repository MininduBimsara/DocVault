"""
PGVector database client — HTTP-based connection proxy for Neon DB Serverless.
Bypasses local TCP port 5432 and Windows SNI issues.
"""

import logging
import requests
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

VECTOR_DIM = 384

try:
    host = settings.POSTGRES_URL.split("@")[1].split("/")[0].split("?")[0]
    HTTP_URL = f"https://{host}/sql"
except Exception:
    HTTP_URL = None

def format_value(p):
    if p is None:
        return "NULL"
    elif isinstance(p, (int, float)):
        return str(p)
    elif isinstance(p, (list, tuple)):
        return ",".join(format_value(x) for x in p)
    elif isinstance(p, np.ndarray):
        vec_str = ",".join(str(x) for x in p.tolist())
        return f"'[{vec_str}]'"
    else:
        escaped = str(p).replace("'", "''")
        return f"'{escaped}'"

def format_sql(sql, params):
    if not params:
        return sql
    if not isinstance(params, (list, tuple)):
        params = (params,)
    
    formatted_params = [format_value(p) for p in params]
    parts = sql.split("%s")
    if len(parts) - 1 != len(formatted_params):
        raise ValueError(f"Placeholder count ({len(parts)-1}) does not match parameters count ({len(formatted_params)})")
        
    result = []
    for i, part in enumerate(parts[:-1]):
        result.append(part)
        result.append(formatted_params[i])
    result.append(parts[-1])
    return "".join(result)

class HTTPCursor:
    def __init__(self, connection):
        self.connection = connection
        self.rows = []
        self.rowcount = 0

    def execute(self, sql, params=None):
        formatted_query = format_sql(sql, params)
        logger.debug("[HTTP SQL] Executing: %s", formatted_query[:200])
        
        headers = {
            "Neon-Connection-String": self.connection.dsn,
        }
        payload = {
            "query": formatted_query,
        }
        
        response = requests.post(self.connection.url, json=payload, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Database error: {response.text}")
            
        data = response.json()
        
        # Parse fields and rows
        fields = [f["name"] for f in data.get("fields", [])]
        raw_rows = data.get("rows", [])
        
        self.rows = []
        for row in raw_rows:
            self.rows.append(tuple(row[f] for f in fields))
            
        self.rowcount = data.get("rowCount", 0)

    def fetchall(self):
        return self.rows

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

class HTTPConnection:
    def __init__(self, url, dsn):
        self.url = url
        self.dsn = dsn

    def cursor(self):
        return HTTPCursor(self)

    def commit(self):
        pass

    def rollback(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def get_conn() -> HTTPConnection:
    """Return a connection proxy yielding an HTTP Neon connection."""
    if not HTTP_URL:
        raise ValueError("Invalid POSTGRES_URL configuration")
    return HTTPConnection(HTTP_URL, settings.POSTGRES_URL)


def init_db() -> None:
    """
    Create the pgvector extension, chunks table, and indices if they don't
    exist. Called once at FastAPI startup.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
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

            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_user_doc "
                "ON document_chunks (user_id, doc_id)"
            )

            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_chunks_hnsw "
                "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
            )

    logger.info("[pgvector] database ready via Neon HTTP SQL API")

