# docvault-rag

FastAPI RAG pipeline service: PDF ingestion, pluggable embeddings (Hugging Face or Gemini), and Chroma vector store.

## Prerequisites

- Python 3.11+
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- `docvault-api` (Express) running on port 4000
- Both services must share the same `INTERNAL_RAG_KEY`

---

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\activate          # Windows
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

| Variable               | Default                                  | Description                                     |
| ---------------------- | ---------------------------------------- | ----------------------------------------------- |
| `PORT`                 | `8000`                                   | FastAPI listen port                             |
| `INTERNAL_RAG_KEY`     | _(required)_                             | Shared secret — must match docvault-api         |
| `FILE_STORAGE_PATH`    | `../shared-storage`                      | Path to the shared PDF storage (repo-relative)  |
| `CHROMA_PATH`          | `./chroma`                               | Local Chroma persistent store directory         |
| `GEMINI_API_KEY`       | _(required)_                             | Google Gemini API key                           |
| `EMBEDDINGS_PROVIDER`  | `huggingface`                            | Embedding backend (`huggingface` or `gemini`)   |
| `EMBEDDINGS_MODEL`     | `models/embedding-001`                   | Gemini embedding model (if provider is gemini)  |
| `HF_EMBEDDINGS_MODEL`  | `sentence-transformers/all-MiniLM-L6-v2` | Hugging Face model (if provider is huggingface) |
| `GEMINI_CHAT_MODEL`    | `models/gemini-1.5-flash`                | Gemini model used to generate chat answers      |
| `EMBED_BATCH_SIZE`     | `25`                                     | Chunks per Gemini embedding call                |
| `EMBED_BATCH_DELAY_MS` | `200`                                    | Milliseconds between embedding batches          |
| `RETRIEVAL_TOP_K`      | `5`                                      | Number of retrieved chunks for `/rag/chat`      |
| `MIN_PAGE_CHARS`       | `50`                                     | Skip PDF pages with fewer characters than this  |
| `API_SERVICE_URL`      | `http://localhost:4000`                  | Express base URL for progress webhook callbacks |

---

## Running

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## API Endpoints

### `GET /health`

Returns `{ "status": "ok" }`.

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

Returns immediately with `{ "ok": true, "message": "ingestion started" }`.  
The pipeline runs in the background and posts progress to Express.

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
PDF file → PyMuPDF extraction → text cleaning → LangChain chunking
      → Embeddings provider (Hugging Face/Gemini) → Chroma upsert
       → POST /internal/docs/:docId/progress (Express webhook)
```

Progress stages reported to Express:
| Stage | When | Status |
|-----------|--------------------------------------|--------------|
| `chunk` | After all chunks are produced | `PROCESSING` |
| `embed` | After each embedding batch | `PROCESSING` |
| `done` | After successful Chroma upsert | `READY` |
| `failed` | On any unhandled exception | `FAILED` |

Chunk IDs in Chroma are deterministic: `{docId}_{page}_{chunkIndex}`  
Re-ingesting the same document overwrites existing chunks (no duplicates).

---

## Chroma Sanity Check

After uploading a PDF and seeing `READY` status in Express, you can verify Chroma:

```python
# run from docvault-rag/ directory
import chromadb
client = chromadb.PersistentClient(path="./chroma")
col = client.get_collection("docvault_chunks")
print("Total chunks:", col.count())

# peek at first 3 chunks for a specific doc
results = col.get(where={"docId": "YOUR_DOC_ID"}, limit=3, include=["documents", "metadatas"])
for doc, meta in zip(results["documents"], results["metadatas"]):
    print(f"  page={meta['page']} chunk={meta['chunkIndex']}: {doc[:80]}…")
```
