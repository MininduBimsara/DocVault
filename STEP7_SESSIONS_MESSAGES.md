# DocVault — Step 7: Sessions + Messages (Persistent Memory)

## Overview

Adds authenticated session and message persistence in `docvault-api` using MongoDB + Mongoose.
This step is **storage/retrieval only** for chat memory: no generation, no RAG retrieval, no ingestion changes.

---

## What Changed

| Status  | File                                                   | Notes                                                             |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| **NEW** | `docvault-api/src/repositories/session.repository.ts`  | User-scoped session CRUD data access                              |
| **NEW** | `docvault-api/src/repositories/message.repository.ts`  | User+session-scoped message write/read/delete                     |
| **NEW** | `docvault-api/src/services/sessions.service.ts`        | Session business rules + selectedDocIds ownership validation      |
| **NEW** | `docvault-api/src/services/messages.service.ts`        | Message business rules + touch session `updatedAt` on new message |
| **NEW** | `docvault-api/src/controllers/sessions.controller.ts`  | HTTP handlers + validation/error mapping                          |
| **NEW** | `docvault-api/src/controllers/messages.controller.ts`  | HTTP handlers + validation/error mapping                          |
| **NEW** | `docvault-api/src/routes/sessions.route.ts`            | `/api/sessions` endpoints + nested messages routes                |
| **NEW** | `docvault-api/src/routes/messages.route.ts`            | `/api/sessions/:sessionId/messages` endpoints                     |
| **NEW** | `docvault-api/src/validators/sessions.validator.ts`    | ObjectId, role, content, title, and limit parsing helpers         |
| **NEW** | `docvault-api/src/docs/sessions-messages-api.md`       | Full endpoint contracts + curl verification                       |
| **MOD** | `docvault-api/src/app.ts`                              | Mounted `sessionsRouter` at `/api/sessions`                       |
| **MOD** | `docvault-api/src/models/message.model.ts`             | Added required index `{ userId: 1, sessionId: 1, createdAt: -1 }` |
| **MOD** | `docvault-api/src/repositories/document.repository.ts` | Added bulk ownership check helper for `selectedDocIds` validation |

---

## Endpoints

### Sessions (`/api/sessions`)

| Method | Path                       | Auth | Description                                    |
| ------ | -------------------------- | ---- | ---------------------------------------------- |
| POST   | `/api/sessions`            | ✅   | Create a session for current user              |
| GET    | `/api/sessions`            | ✅   | List current user sessions (`updatedAt desc`)  |
| GET    | `/api/sessions/:sessionId` | ✅   | Get single session if owned by user            |
| PATCH  | `/api/sessions/:sessionId` | ✅   | Update `title` and/or `selectedDocIds`         |
| DELETE | `/api/sessions/:sessionId` | ✅   | Delete session and cascade-delete its messages |

### Messages (`/api/sessions/:sessionId/messages`)

| Method | Path                                | Auth | Description                                 |
| ------ | ----------------------------------- | ---- | ------------------------------------------- |
| POST   | `/api/sessions/:sessionId/messages` | ✅   | Persist message (`role`, `content`)         |
| GET    | `/api/sessions/:sessionId/messages` | ✅   | Fetch last N messages (default 20, max 100) |

---

## Validation & Error Rules

- Invalid ObjectId in params/body → `400`
- Session not found **or not owned by caller** → `404` (no existence leak)
- `selectedDocIds` must be valid ObjectIds and must belong to caller
- Message `role` must be one of: `user | assistant | system`
- Message `content` must be non-empty string
- `limit` defaults to `20`, clamped to `1..100`

---

## Multi-Tenancy Guarantees

- Every session and message query filters by `req.user.id`.
- Messages cannot be written/read for another user’s session.
- `selectedDocIds` are validated against documents owned by current user.

---

## Data Model / Indexes (Step 7)

- `sessions` index: `{ userId: 1, updatedAt: -1 }`
- `messages` index: `{ userId: 1, sessionId: 1, createdAt: -1 }`

Message fetch path uses:

- filter: `{ userId, sessionId }`
- sort: `createdAt desc`
- limit: `N`
- return reversed in API output (`oldest -> newest`) for UI rendering

---

## Delete Semantics

`DELETE /api/sessions/:sessionId` performs **cascade delete** for messages in that session (same user scope).

---

## Verification

Detailed examples: `docvault-api/src/docs/sessions-messages-api.md`

Quick flow (assumes `cookies.txt` from login):

```bash
# 1) Create session
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"My first chat","selectedDocIds":[]}'

# 2) List sessions
curl -i -b cookies.txt http://localhost:4000/api/sessions

# 3) Write message
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions/<sessionId>/messages \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"Hello, DocVault"}'

# 4) Fetch history
curl -i -b cookies.txt "http://localhost:4000/api/sessions/<sessionId>/messages?limit=20"
```

---

## Out of Scope (Intentionally Not Included)

- ❌ Assistant generation
- ❌ RAG retrieval / context assembly
- ❌ Ingestion pipeline changes
- ❌ Frontend integration

This step is complete when sessions/messages can be created and chat history is loaded from MongoDB.
