# Ingestion Integration — Step 5

## Upload Flow

```
Client (browser/curl)
  │
  │  POST /api/documents/upload  (multipart, cookie auth)
  ▼
docvault-api (Express :4000)
  │  1. Save PDF to FILE_STORAGE_PATH/{userId}/{docId}.pdf
  │  2. Create Mongo doc (status=UPLOADED)
  │  3. POST /ingest → docvault-rag   ← INTERNAL_RAG_KEY header
  │        on 2xx → set status=PROCESSING, stage="queued"
  │        on err → throw 502 "Ingestion service unavailable"
  │  4. Return { document: { status:"PROCESSING" } }
  ▼
docvault-rag (FastAPI :8000)
  │  5. Validates INTERNAL_RAG_KEY + file exists
  │  6. Responds 200 { ok:true } immediately
  │  7. Starts BackgroundTask pipeline:
  │       extract → chunk → embed → upsert → done
  │       Each stage calls POST /internal/docs/:docId/progress
  ▼
docvault-api /internal/docs/:docId/progress
  │  8. Validates INTERNAL_RAG_KEY header
  │  9. Updates Mongo doc.progress + doc.status
```

---

## POST /ingest (docvault-rag)

**URL:** `POST http://localhost:8000/ingest`

**Required header:**

```
INTERNAL_RAG_KEY: <shared secret>
```

**Request body:**

```json
{
  "userId": "string",
  "docId": "string",
  "filePath": "/absolute/path/to/{docId}.pdf",
  "fileName": "original-name.pdf"
}
```

**Response (200):**

```json
{ "ok": true, "message": "ingestion started" }
```

---

## POST /internal/docs/:docId/progress (docvault-api)

**URL:** `POST http://localhost:4000/internal/docs/{docId}/progress`

**Required header:**

```
INTERNAL_RAG_KEY: <shared secret>
```

**Request body** (all fields optional):

```json
{
  "stage": "extract|chunk|embed|upsert|done|failed",
  "totalPages": 42,
  "chunksTotal": 120,
  "chunksDone": 60,
  "status": "PROCESSING|READY|FAILED",
  "errorMessage": "description of error (sets status=FAILED automatically)"
}
```

**Response (200):**

```json
{ "ok": true }
```

> **Note:** If `errorMessage` is provided, `status` is forced to `FAILED` regardless of the `status` field.

---

## curl Examples

### 1. Upload a PDF (logged in via cookie)

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/documents/upload \
  -F "file=@/absolute/path/to/sample.pdf"
# Expected: 201 { document: { status: "PROCESSING" } }
```

### 2. List documents

```bash
curl -i -b cookies.txt http://localhost:4000/api/documents
# Expected: status: "PROCESSING" → eventually "READY"
```

### 3. Manually post a progress update

```bash
curl -i -X POST http://localhost:4000/internal/docs/<docId>/progress \
  -H "Content-Type: application/json" \
  -H "INTERNAL_RAG_KEY: change_me_shared_secret_sudda" \
  -d '{"stage":"chunk","chunksTotal":20,"chunksDone":5,"status":"PROCESSING"}'
# Expected: 200 { ok: true }
```

### 4. Mark document as READY manually

```bash
curl -i -X POST http://localhost:4000/internal/docs/<docId>/progress \
  -H "Content-Type: application/json" \
  -H "INTERNAL_RAG_KEY: change_me_shared_secret_sudda" \
  -d '{"stage":"done","status":"READY"}'
```

### 5. Simulate ingestion failure

```bash
curl -i -X POST http://localhost:4000/internal/docs/<docId>/progress \
  -H "Content-Type: application/json" \
  -H "INTERNAL_RAG_KEY: change_me_shared_secret_sudda" \
  -d '{"stage":"failed","errorMessage":"PDF is corrupted"}'
# Expected: sets status=FAILED and error.message in Mongo
```

### 6. Test key rejection (expect 401)

```bash
curl -i -X POST http://localhost:4000/internal/docs/<docId>/progress \
  -H "Content-Type: application/json" \
  -H "INTERNAL_RAG_KEY: wrong_key" \
  -d '{"stage":"chunk"}'
```

---

## Environment Variables

| Service      | Variable           | Description                                       |
| ------------ | ------------------ | ------------------------------------------------- |
| docvault-api | `RAG_SERVICE_URL`  | FastAPI base URL (default: http://localhost:8000) |
| docvault-api | `INTERNAL_RAG_KEY` | Shared secret (required on startup)               |
| docvault-rag | `API_SERVICE_URL`  | Express base URL (default: http://localhost:4000) |
| docvault-rag | `INTERNAL_RAG_KEY` | Same shared secret                                |
