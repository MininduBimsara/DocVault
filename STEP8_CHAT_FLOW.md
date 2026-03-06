# DocVault — Step 8: Chat Flow (Express Orchestrates, FastAPI Answers)

## Overview

Implements end-to-end chat for DocVault with a strict split of responsibilities:

- **Express (`docvault-api`)** = auth/session/message orchestration + persistence
- **FastAPI (`docvault-rag`)** = retrieval + context-only answer generation

This step is **non-streaming**, **no reranking**, and **no query log persistence**.

---

## Architecture Rule

1. Client calls `POST /api/chat` on Express
2. Express validates auth + session ownership, loads context/history, saves user message
3. Express calls FastAPI `POST /rag/chat` with internal key
4. FastAPI retrieves only chunks matching `userId AND docId in selectedDocIds`
5. FastAPI generates context-only answer and returns `answer + sources`
6. Express saves assistant message with `sources` and returns response

---

## What Step 8 Added

### Express (`docvault-api`)

- New endpoint: `POST /api/chat`
- New internal client: `src/clients/ragChat.client.ts`
- New orchestration service: `src/services/chat.service.ts`
- New controller/route: `src/controllers/chat.controller.ts`, `src/routes/chat.route.ts`
- Mounted route in `src/app.ts`: `app.use("/api/chat", chatRouter)`
- Message schema updated to support `sources[]` metadata

### FastAPI (`docvault-rag`)

- New endpoint: `POST /rag/chat` (internal only)
- Internal auth enforced with `INTERNAL_RAG_KEY`
- New schema/route/service modules:
  - `app/schemas/rag_chat.py`
  - `app/routes/rag_chat.py`
  - `app/services/rag_chat_service.py`
  - `app/services/retriever.py`
  - `app/services/generator.py`
- Mounted route in `app/main.py`: `app.include_router(rag_chat_router, prefix="/rag", tags=["rag"])`

---

## API Contracts

## 1) Express Chat Endpoint

### `POST /api/chat`

Auth: `requireAuth` (cookie-based JWT)

Request:

```json
{
  "sessionId": "string",
  "question": "string"
}
```

Validation:

- `sessionId` required + valid ObjectId
- `question` required, trimmed, non-empty
- question length guard enforced (max 4000 chars)

Behavior:

- verifies authenticated user
- verifies session belongs to user
- loads `session.selectedDocIds`
- loads last `N=10` messages (chronological)
- saves **user** message first
- calls FastAPI `/rag/chat`
- saves **assistant** message with optional `sources`
- updates `session.updatedAt`

Response:

```json
{
  "answer": "string",
  "sources": [
    {
      "docId": "string",
      "fileName": "string",
      "page": 3,
      "chunkId": "string",
      "snippet": "string"
    }
  ],
  "sessionId": "string"
}
```

Error mapping:

- `400` invalid payload
- `401` unauthenticated
- `404` session not found/not owned
- `502` RAG service failure

---

## 2) FastAPI RAG Endpoint

### `POST /rag/chat`

Header:

- `INTERNAL_RAG_KEY: <shared-secret>`

Request:

```json
{
  "userId": "string",
  "docIds": ["string"],
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "question": "string"
}
```

Response:

```json
{
  "answer": "string",
  "sources": [
    {
      "docId": "string",
      "fileName": "string",
      "page": 3,
      "chunkId": "string",
      "snippet": "string"
    }
  ]
}
```

Security:

- invalid/missing internal key → `401`

---

## Retrieval & Isolation Guarantees (Most Important)

Chroma retrieval is filtered with both conditions:

- `userId == payload.userId`
- `docId in payload.docIds`

Filter shape used:

```python
{
  "$and": [
    {"userId": user_id},
    {"docId": {"$in": doc_ids}}
  ]
}
```

Additionally, retrieved metadata is re-validated in code before use.

This ensures **no cross-user retrieval** and no unfiltered global search.

---

## Context-Only + Citations Behavior

- If `docIds` is empty:
  - answer: `I can’t answer because no documents are selected for this session.`
  - sources: `[]`
- If retrieval returns no chunks:
  - answer: `I couldn't find the answer in the selected documents.`
  - sources: `[]`
- Generation prompt explicitly forbids outside knowledge.
- `sources` are deduplicated and include snippet previews.

Chunk ID format:

- `{docId}_{page}_{chunkIndex}`

---

## Message Persistence Rules

In Express:

- user message saved as `role="user"`
- assistant message saved as `role="assistant"`
- assistant may include `sources[]`

Example assistant message shape:

```json
{
  "userId": "...",
  "sessionId": "...",
  "role": "assistant",
  "content": "...",
  "sources": [
    {
      "docId": "...",
      "fileName": "...",
      "page": 3,
      "chunkId": "...",
      "snippet": "..."
    }
  ]
}
```

---

## Environment Variables Used in Step 8

### `docvault-api`

- `RAG_SERVICE_URL`
- `INTERNAL_RAG_KEY`
- `RAG_CHAT_TIMEOUT_MS` (default `20000`)

### `docvault-rag`

- `INTERNAL_RAG_KEY`
- `CHROMA_PATH`
- `GEMINI_API_KEY`
- `GEMINI_CHAT_MODEL`
- `EMBEDDINGS_MODEL`
- `RETRIEVAL_TOP_K` (default `5`)

---

## Verification (End-to-End)

Assumptions:

- user is logged in
- `cookies.txt` exists
- at least one PDF has status `READY`
- session exists and has `selectedDocIds`

### 1) Call chat

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"<sessionId>",
    "question":"What does this document say about the main objective?"
  }'
```

### 2) Confirm response contains

- `answer`
- `sources[]`

### 3) Fetch session messages

```bash
curl -i -b cookies.txt "http://localhost:4000/api/sessions/<sessionId>/messages?limit=20"
```

### 4) Confirm persistence

- user message saved
- assistant message saved
- assistant message contains `sources` metadata

---

## Out of Scope (Intentionally Not Included)

- ❌ streaming responses
- ❌ query_logs persistence
- ❌ reranking pipeline

Step 8 is complete when chat works end-to-end and retrieval is always constrained by both `userId` and selected `docIds`.
