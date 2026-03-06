# Chat API (Step 8)

Base URL: `http://localhost:4000`  
Auth: HttpOnly cookie (`docvault_token`) via `requireAuth`.

---

## Endpoint

### `POST /api/chat`

Express orchestrates the chat flow:

- verifies authenticated user
- verifies session ownership
- loads last 10 session messages as history
- saves user message
- calls FastAPI `POST /rag/chat`
- saves assistant message + `sources`

Request:

```json
{
  "sessionId": "67cb8ac4cf9f1f0fcf5f1e88",
  "question": "What does this document say about the main objective?"
}
```

Response:

```json
{
  "answer": "...",
  "sources": [
    {
      "docId": "67cb8a53cf9f1f0fcf5f1e72",
      "fileName": "strategy.pdf",
      "page": 3,
      "chunkId": "67cb8a53cf9f1f0fcf5f1e72_3_1",
      "snippet": "The primary objective is to..."
    }
  ],
  "sessionId": "67cb8ac4cf9f1f0fcf5f1e88"
}
```

---

## Notes

- If no documents are selected in the session, Express still forwards request with `docIds: []`.
- FastAPI returns a safe answer (`no documents selected`) and `sources: []`.
- If FastAPI fails, Express returns `502` and does not save a fake assistant message.

---

## Error codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 400  | invalid payload (`sessionId`, `question`) |
| 401  | not authenticated                         |
| 404  | session not found / not owned by user     |
| 502  | internal RAG service unavailable          |
