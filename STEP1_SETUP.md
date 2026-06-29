# DocVault — Setup & Running Guide

## Architecture

| Service        | Stack                                   | Port   | Responsibility                                                |
| -------------- | --------------------------------------- | ------ | ------------------------------------------------------------- |
| `docvault-api` | Node.js · Express · TypeScript          | `4000` | Auth, users, document metadata, sessions, messages            |
| `docvault-rag` | Python 3.10+ · FastAPI · Uvicorn        | `8000` | PDF ingestion, Hugging Face embeddings, PGVector, RAG chat    |
| `frontend`     | Next.js · React · Redux Toolkit         | `3000` | UI — upload, chat, session management                         |
| PostgreSQL 16  | pgvector extension                      | `5432` | Vector store for document chunk embeddings                    |
| MongoDB 7      | —                                       | `27017`| Document metadata, users, sessions, messages                  |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + MongoDB)
- Node.js 18+
- Python 3.10+

---

## 1 — Start databases

```powershell
# From the repo root
docker compose up -d
```

This starts:
- **PostgreSQL 16 + pgvector** on `localhost:5432` (user: `docvault`, db: `docvault`)
- **MongoDB 7** on `localhost:27017`

Both persist data in Docker named volumes (`postgres_data`, `mongo_data`).

---

## 2 — docvault-rag (Python / FastAPI)

```powershell
cd docvault-rag

# First time only
python -m venv .venv
.\.venv\Scripts\activate        # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Copy env and fill in your Gemini API key
cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here

# Start
python -m uvicorn app.main:app --reload --port 8000
```

On startup the service:
1. Connects to PostgreSQL and creates the `document_chunks` table + HNSW index (idempotent).
2. Ensures `shared-storage/` exists.
3. Prints a confirmation banner.

---

## 3 — docvault-api (Node.js / Express)

```powershell
cd docvault-api

# First time only
cp .env.example .env
npm install

# Start dev server (hot-reload)
npm run dev
```

| Script          | Command                             |
| --------------- | ----------------------------------- |
| `npm run dev`   | `ts-node-dev` hot-reload on `:4000` |
| `npm run build` | Compile TypeScript to `dist/`       |
| `npm start`     | Run compiled output                 |

---

## 4 — frontend (Next.js)

```powershell
cd frontend

# First time only
npm install

# Start dev server
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## Environment Variables

### docvault-rag `.env`

| Variable              | Required | Default                                          | Description                                      |
| --------------------- | -------- | ------------------------------------------------ | ------------------------------------------------ |
| `PORT`                | ✅       | `8000`                                           | FastAPI server port                              |
| `INTERNAL_RAG_KEY`    | ✅       | —                                                | Shared secret (must match docvault-api)          |
| `FILE_STORAGE_PATH`   | ✅       | `../shared-storage`                              | Path to uploaded PDFs                            |
| `POSTGRES_URL`        | ✅       | `postgresql://docvault:docvault_password@...`    | PostgreSQL connection string                     |
| `GEMINI_API_KEY`      | ✅       | —                                                | Google Gemini API key                            |
| `HF_EMBEDDINGS_MODEL` | ✅       | `sentence-transformers/all-MiniLM-L6-v2`         | Hugging Face embedding model (local inference)   |
| `GEMINI_CHAT_MODEL`   | ✅       | `models/gemini-1.5-flash`                        | Gemini model for answer generation               |
| `EMBED_BATCH_SIZE`    | ❌       | `25`                                             | Chunks per embedding batch                       |
| `EMBED_BATCH_DELAY_MS`| ❌       | `200`                                            | Ms between embedding batches                     |
| `RETRIEVAL_TOP_K`     | ❌       | `5`                                              | Chunks returned per RAG query                    |
| `MIN_PAGE_CHARS`      | ❌       | `50`                                             | Skip PDF pages below this character count        |
| `API_SERVICE_URL`     | ✅       | `http://localhost:4000`                          | Express API URL (for progress webhooks)          |

### docvault-api `.env`

| Variable            | Required | Default                   | Description                               |
| ------------------- | -------- | ------------------------- | ----------------------------------------- |
| `PORT`              | ✅       | `4000`                    | Express server port                       |
| `MONGO_URI`         | ✅       | `mongodb://localhost/...` | MongoDB connection string                 |
| `JWT_SECRET`        | ✅       | —                         | JWT signing secret (use a long random str)|
| `JWT_EXPIRES_IN`    | ❌       | `7d`                      | Token TTL                                 |
| `FRONTEND_ORIGIN`   | ✅       | `http://localhost:3000`   | CORS allowed origin                       |
| `RAG_SERVICE_URL`   | ✅       | `http://localhost:8000`   | FastAPI RAG service URL                   |
| `INTERNAL_RAG_KEY`  | ✅       | —                         | Shared secret (must match docvault-rag)   |
| `FILE_STORAGE_PATH` | ✅       | `../shared-storage`       | Path to uploaded PDFs                     |
| `MAX_UPLOAD_MB`     | ❌       | `25`                      | Max PDF upload size                       |

---

## Health Checks

```bash
curl http://localhost:4000/health   # → { "status": "ok", "service": "docvault-api" }
curl http://localhost:8000/health   # → { "status": "ok" }
```

---

## PGVector Schema

The RAG service auto-creates this on startup:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id          TEXT PRIMARY KEY,        -- "{docId}_{page}_{chunkIndex}"
    content     TEXT NOT NULL,
    embedding   vector(384) NOT NULL,   -- all-MiniLM-L6-v2 output dimension
    user_id     TEXT NOT NULL,
    doc_id      TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    page        INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- B-tree for multi-tenant filtering
CREATE INDEX idx_chunks_user_doc ON document_chunks (user_id, doc_id);

-- HNSW for approximate nearest-neighbour cosine search
CREATE INDEX idx_chunks_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

Similarity queries use the pgvector `<=>` cosine distance operator.

---

## Document Lifecycle

```
Upload PDF  → Express saves file → creates Mongo record (UPLOADED)
            → POST /ingest (RAG service)
            → PyMuPDF extract → clean → chunk → embed (HuggingFace)
            → upsert to PGVector (ON CONFLICT DO UPDATE)
            → webhook: READY

Chat        → Express calls POST /rag/chat
            → embed question → cosine search in PGVector (filtered by userId + docIds)
            → top-5 chunks → Gemini generates answer → sources returned

Delete doc  → Express removes PDF from disk
            → DELETE /ingest/{docId} (RAG service removes PGVector rows)
            → delete Mongo record
```
