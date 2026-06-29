# docvault-rag

FastAPI RAG pipeline service: PDF ingestion, Hugging Face embeddings, and PostgreSQL pgvector storage.

## Prerequisites

- Python 3.10+
- **PostgreSQL 16 + pgvector** running on `localhost:5432` — use `docker compose up -d` from the repo root
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `docvault-api` (Express) running on port 4000
- Both services must share the same `INTERNAL_RAG_KEY`

---

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows
# source .venv/bin/activate       # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env            # Windows
# cp .env.example .env            # macOS / Linux
# → Open .env and set GEMINI_API_KEY and INTERNAL_RAG_KEY
```

---

## Environment Variables

| Variable               | Default                                          | Description                                     |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `PORT`                 | `8000`                                           | FastAPI listen port                             |
| `INTERNAL_RAG_KEY`     | _(required)_                                     | Shared secret — must match docvault-api         |
| `FILE_STORAGE_PATH`    | `../shared-storage`                              | Path to the shared PDF storage (repo-relative)  |
| `POSTGRES_URL`         | `postgresql://docvault:docvault_password@localhost:5432/docvault` | PostgreSQL connection string |
| `GEMINI_API_KEY`       | _(required)_                                     | Google Gemini API key                           |
| `HF_EMBEDDINGS_MODEL`  | `sentence-transformers/all-MiniLM-L6-v2`         | Hugging Face model used for embeddings          |
| `GEMINI_CHAT_MODEL`    | `models/gemini-1.5-flash`                        | Gemini model used to generate chat answers      |
| `EMBED_BATCH_SIZE`     | `25`                                             | Chunks per embedding call                       |
| `EMBED_BATCH_DELAY_MS` | `200`                                            | Milliseconds between embedding batches          |
| `RETRIEVAL_TOP_K`      | `5`                                              | Number of retrieved chunks for `/rag/chat`      |
| `MIN_PAGE_CHARS`       | `50`                                             | Skip PDF pages with fewer characters than this  |
| `API_SERVICE_URL`      | `http://localhost:4000`                          | Express base URL for progress webhook callbacks |

---

## Running

```bash
# Development (with auto-reload)
python -m uvicorn app.main:app --reload --port 8000

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

On startup, the service automatically creates the `document_chunks` table and HNSW cosine index in PostgreSQL if they don't exist.

---

## API Endpoints

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /ingest`

Triggers PDF ingestion.  
**Header:** `INTERNAL_RAG_KEY: <secret>`  
**Body:**

```json
{
  "userId": "...",
  "docId": "...",
  "filePath": "/absolute/path/to/file.pdf",
  "fileName": "document.pdf"
}
```

Returns immediately: `{ "ok": true, "message": "ingestion started" }`.  
The pipeline runs in the background and posts progress webhooks to Express.

### `DELETE /ingest/{docId}`

Deletes all vector chunks for a document from PGVector.  
**Header:** `INTERNAL_RAG_KEY: <secret>`  
Returns: `{ "ok": true, "deletedChunks": N }`

### `POST /rag/chat`

Internal RAG answering endpoint used by `docvault-api`.

**Header:** `INTERNAL_RAG_KEY: <secret>`

**Body:**

```json
{
  "userId": "...",
  "docIds": ["..."],
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "question": "..."
}
```

Retrieval is always filtered by both `userId` and `docIds` before generation.

---

## Ingestion Pipeline

```
PDF file
  → PyMuPDF text extraction
  → Text cleaning (whitespace, repeated headers/footers)
  → LangChain recursive chunking (800 chars, 100 overlap)
  → Hugging Face embeddings (batched, local inference)
  → PGVector upsert — ON CONFLICT DO UPDATE (idempotent)
  → POST /internal/docs/:docId/progress (Express webhook)
```

Progress stages reported to Express:

| Stage    | When                              | Status       |
|----------|-----------------------------------|--------------|
| `chunk`  | After all chunks are produced     | `PROCESSING` |
| `embed`  | After each embedding batch        | `PROCESSING` |
| `done`   | After successful PGVector upsert  | `READY`      |
| `failed` | On any unhandled exception        | `FAILED`     |

Chunk IDs are deterministic: `{docId}_{page}_{chunkIndex}`  
Re-ingesting the same document overwrites existing chunks (no duplicates).

---

## PGVector Schema

```sql
CREATE TABLE document_chunks (
    id          TEXT PRIMARY KEY,        -- "{docId}_{page}_{chunkIndex}"
    content     TEXT NOT NULL,
    embedding   vector(384) NOT NULL,   -- all-MiniLM-L6-v2 dimensions
    user_id     TEXT NOT NULL,
    doc_id      TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    page        INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- B-tree for fast multi-tenant filtering
CREATE INDEX idx_chunks_user_doc ON document_chunks (user_id, doc_id);

-- HNSW for approximate nearest-neighbour cosine search
CREATE INDEX idx_chunks_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

Similarity search uses the pgvector `<=>` cosine distance operator.

---

## Sanity Check

After uploading a PDF and seeing `READY` status, verify the chunks in PostgreSQL:

```bash
# Connect to the database
docker exec -it docvault-postgres psql -U docvault -d docvault

-- Count all chunks
SELECT COUNT(*) FROM document_chunks;

-- Inspect chunks for a specific document
SELECT id, page, chunk_index, LEFT(content, 80)
FROM document_chunks
WHERE doc_id = 'YOUR_DOC_ID'
ORDER BY page, chunk_index
LIMIT 10;
```
