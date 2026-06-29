# DocVault

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets users upload PDF documents and chat with them using Google Gemini — grounded strictly in their own documents, with full multi-tenant isolation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 · React 19 · Redux Toolkit · Tailwind CSS |
| **API** | Node.js · Express · TypeScript · JWT (HttpOnly cookies) |
| **RAG Service** | Python · FastAPI · Uvicorn |
| **Embeddings** | Hugging Face `sentence-transformers/all-MiniLM-L6-v2` (local, 384-dim) |
| **Vector Store** | PostgreSQL 16 + **pgvector** (HNSW cosine index) |
| **LLM** | Google Gemini 1.5 Flash (context-only generation) |
| **Document DB** | MongoDB 7 (users, sessions, messages, document metadata) |
| **PDF Extraction** | PyMuPDF |

---

## Features

- **JWT authentication** — register, login, logout with HttpOnly cookie sessions
- **PDF upload & ingestion** — documents are chunked, embedded, and indexed in PGVector automatically in the background
- **Real-time ingestion progress** — frontend polls document status (UPLOADED → PROCESSING → READY / FAILED)
- **Multi-document RAG chat** — select one or more documents per session; answers are sourced only from selected docs
- **Session management** — persistent chat sessions with full conversation history
- **Source citations** — every answer links back to the exact document chunk and page
- **Multi-tenant isolation** — all queries are scoped by authenticated `userId`; users never see each other's data
- **Document deletion** — removes file, vector embeddings, and DB record atomically

---

## Architecture

```
┌─────────────┐     REST / cookies      ┌──────────────────┐
│  Next.js    │ ──────────────────────▶ │  Express API     │
│  Frontend   │ ◀────────────────────── │  :4000           │
│  :3000      │                         │                  │
└─────────────┘                         │  MongoDB         │
                                        │  (users/sessions │
                                        │   /messages/docs)│
                                        └────────┬─────────┘
                                                 │ internal HTTP
                                                 │ (INTERNAL_RAG_KEY)
                                        ┌────────▼─────────┐
                                        │  FastAPI RAG     │
                                        │  :8000           │
                                        │                  │
                                        │  HuggingFace     │
                                        │  Embeddings      │
                                        │  (local)         │
                                        │                  │
                                        │  PostgreSQL 16   │
                                        │  + pgvector      │
                                        │  (HNSW index)    │
                                        └──────────────────┘
```

---

## Document Lifecycle

```
Upload PDF
  → Express saves file to shared-storage/{userId}/{docId}.pdf
  → Creates MongoDB record (status: UPLOADED)
  → Calls POST /ingest (FastAPI)

Background ingestion (FastAPI)
  → PyMuPDF text extraction
  → Text cleaning (whitespace, headers, footers)
  → LangChain recursive chunking (800 chars / 100 overlap)
  → Hugging Face embeddings in batches of 25
  → PGVector upsert — ON CONFLICT DO UPDATE (idempotent)
  → Webhook back to Express at each stage (chunk → embed → done/failed)

Chat query
  → Embed question (HuggingFace, local)
  → PGVector cosine ANN search filtered by userId + selected docIds
  → Top-5 chunks → Gemini generates context-only answer
  → Answer + source citations returned to frontend

Delete document
  → Remove PDF from disk
  → DELETE /ingest/{docId} — removes all PGVector rows
  → Delete MongoDB record
```

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 18+
- Python 3.10+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### 1. Clone & start databases

```bash
git clone <repo-url>
cd DocVault
docker compose up -d
```

Starts **PostgreSQL 16 + pgvector** on `:5432` and **MongoDB 7** on `:27017`.

### 2. RAG service

```powershell
cd docvault-rag
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt
# Edit .env — set GEMINI_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

On first startup the service creates the `document_chunks` table and HNSW index automatically.

### 3. Express API

```powershell
cd docvault-api
npm install
# Edit .env if needed (defaults work with Docker databases)
npm run dev
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** to use the app.

---

## Environment Variables

| Service | Key variable | Value |
|---|---|---|
| `docvault-rag` | `GEMINI_API_KEY` | Your Gemini key |
| `docvault-rag` | `POSTGRES_URL` | `postgresql://docvault:docvault_password@localhost:5432/docvault` |
| `docvault-rag` | `INTERNAL_RAG_KEY` | Any shared secret (must match API) |
| `docvault-api` | `JWT_SECRET` | Any long random string |
| `docvault-api` | `INTERNAL_RAG_KEY` | Same shared secret as above |
| `docvault-api` | `MONGO_URI` | `mongodb://localhost:27017/docvault` |

See [STEP1_SETUP.md](STEP1_SETUP.md) for the full variable reference.

---

## API Endpoints

### Auth (`docvault-api`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login — sets HttpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Get current user |

### Documents
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload PDF (triggers background ingestion) |
| `GET` | `/api/documents` | List user's documents |
| `DELETE` | `/api/documents/:docId` | Delete document + embeddings |

### Sessions & Chat
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions` | Create chat session |
| `GET` | `/api/sessions` | List sessions |
| `POST` | `/api/messages` | Send message (calls RAG) |
| `GET` | `/api/sessions/:id/messages` | Get conversation history |

### RAG service (`docvault-rag`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/ingest` | Trigger ingestion (internal) |
| `DELETE` | `/ingest/:docId` | Delete embeddings (internal) |
| `POST` | `/rag/chat` | Retrieve + generate answer (internal) |

---

## Project Structure

```
DocVault/
├── docker-compose.yml          ← PostgreSQL+pgvector + MongoDB
├── shared-storage/             ← uploaded PDFs (auto-created)
├── STEP1_SETUP.md              ← detailed setup & env var reference
│
├── docvault-api/               ← Express API (TypeScript)
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/             ← Mongoose schemas
│       ├── routes/
│       ├── clients/            ← RAG service HTTP client
│       └── middleware/
│
├── docvault-rag/               ← FastAPI RAG service (Python)
│   └── app/
│       ├── core/
│       │   ├── pgvector_db.py  ← connection pool + DDL init
│       │   ├── embeddings.py   ← HuggingFace wrapper
│       │   ├── config.py
│       │   └── gemini.py
│       ├── services/
│       │   ├── ingest_service.py
│       │   ├── retriever.py    ← pgvector cosine search
│       │   ├── chunker.py
│       │   └── pdf_loader.py
│       └── routes/
│
└── frontend/                   ← Next.js app (TypeScript)
    └── src/
        ├── app/                ← App Router pages
        ├── components/
        └── store/              ← Redux Toolkit slices
```
