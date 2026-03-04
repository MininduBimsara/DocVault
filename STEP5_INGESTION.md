# Step 5 — Ingestion Pipeline (Simulated)

## What Step 5 Actually Does

The `POST /ingest` endpoint in `docvault-rag` runs a **simulated** ingestion
pipeline using `asyncio.sleep` delays. There is no real PDF parsing, chunking,
embedding, or vector DB writes yet — that is Step 6's job.

```python
# app/routes/ingest.py — _run_pipeline()
stages = [
    ("extract", 1),   # asyncio.sleep(1) — fake PDF extraction
    ("chunk",   1),   # asyncio.sleep(1) — fake text chunking
    ("embed",   1),   # asyncio.sleep(1) — fake embedding
    ("upsert",  1),   # asyncio.sleep(1) — fake Chroma upsert
]
```

At each stage it posts a progress webhook to Express:

```
POST /internal/docs/{docId}/progress   ← INTERNAL_RAG_KEY header
{ "stage": "extract", "status": "PROCESSING" }
```

---

## Timeline After Upload

| Time | Event                                                                                         |
| ---- | --------------------------------------------------------------------------------------------- |
| 0 s  | Express `POST /api/documents/upload` → saves file, creates DB record                          |
| 0 s  | Express `POST http://localhost:8000/ingest` → FastAPI responds `200 { ok: true }` immediately |
| 0 s  | Express sets `doc.status = PROCESSING`, `progress.stage = "queued"`                           |
| +1 s | FastAPI posts `stage=extract` → Mongo updated                                                 |
| +2 s | FastAPI posts `stage=chunk` → Mongo updated                                                   |
| +3 s | FastAPI posts `stage=embed` → Mongo updated                                                   |
| +4 s | FastAPI posts `stage=upsert` → Mongo updated                                                  |
| +4 s | FastAPI posts `stage=done, status=READY` → `doc.status = READY`                               |

---

## What Step 6 Will Replace

Step 6 will replace the `asyncio.sleep` stubs inside `_run_pipeline()` in
`app/routes/ingest.py` with real logic:

| Stage     | Step 6 Real Work                                                                     |
| --------- | ------------------------------------------------------------------------------------ |
| `extract` | Open PDF with `pypdf` / `pdfplumber`, extract raw text + page count                  |
| `chunk`   | Split text into overlapping chunks (e.g. LangChain `RecursiveCharacterTextSplitter`) |
| `embed`   | Generate embeddings via `sentence-transformers` or OpenAI                            |
| `upsert`  | Write chunk vectors into ChromaDB                                                    |

The webhook plumbing, background task structure, and progress model are already
in place and **will not change** — Step 6 only fills in the real logic inside
`_run_pipeline()`.
