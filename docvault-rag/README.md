# docvault-rag

**Stack:** Python 3.10+ · FastAPI · Uvicorn  
**Port:** `8000`

## Responsibility

Handles embeddings, Chroma vector store, document ingestion, retrieval, and generation (future steps).  
This is the **Step 1 baseline** — only configuration and health route wired up.

## Quick Start

```bash
# 1. Create & activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Copy env file
cp .env.example .env

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run development server
uvicorn app.main:app --reload --port 8000
```

## Health Check

```bash
curl http://localhost:8000/health
# → { "status": "ok", "service": "docvault-rag" }
```

## Env Variables

| Variable            | Required | Description                             |
| ------------------- | -------- | --------------------------------------- |
| `PORT`              | ✅       | Server port (default 8000)              |
| `CHROMA_PATH`       | ✅       | Path to Chroma store (placeholder)      |
| `EMBEDDINGS_MODEL`  | ✅       | HuggingFace model name (placeholder)    |
| `INTERNAL_RAG_KEY`  | ❌       | Shared secret for internal comms        |
| `FILE_STORAGE_PATH` | ✅       | Relative path to the shared-storage dir |
