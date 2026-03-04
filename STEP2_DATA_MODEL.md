# DocVault — Step 2: Data Model Design (MongoDB)

## Overview

Mongoose models, MongoDB connection, TypeScript types, and a schema reference document added to `docvault-api`.
No routes, controllers, auth logic, or file upload logic — schema definition only.

---

## What Changed

| Status  | File                                        | Notes                                        |
| ------- | ------------------------------------------- | -------------------------------------------- |
| **NEW** | `docvault-api/src/db/mongo.ts`              | `connectDB()` / `disconnectDB()`             |
| **NEW** | `docvault-api/src/types/mongo.ts`           | `MongoId` alias, `WithTimestamps` interface  |
| **NEW** | `docvault-api/src/models/user.model.ts`     | `users` collection                           |
| **NEW** | `docvault-api/src/models/document.model.ts` | `documents` collection                       |
| **NEW** | `docvault-api/src/models/session.model.ts`  | `sessions` collection                        |
| **NEW** | `docvault-api/src/models/message.model.ts`  | `messages` collection                        |
| **NEW** | `docvault-api/src/models/queryLog.model.ts` | `query_logs` collection (planned)            |
| **NEW** | `docvault-api/src/docs/data-model.md`       | Full schema reference                        |
| **MOD** | `docvault-api/src/config/env.ts`            | `MONGO_URI` added to required env vars       |
| **MOD** | `docvault-api/src/server.ts`                | Real `connectDB()` replaces placeholder stub |

### Dependency Added

```bash
npm install mongoose   # ships its own TS types — no @types/mongoose needed
```

---

## File Structure (additions)

```
docvault-api/src/
  db/
    mongo.ts             ← Mongoose connect / disconnect
  types/
    mongo.ts             ← MongoId, WithTimestamps
  models/
    user.model.ts        ← users
    document.model.ts    ← documents
    session.model.ts     ← sessions
    message.model.ts     ← messages
    queryLog.model.ts    ← query_logs (planned)
  docs/
    data-model.md        ← human-readable schema reference
```

---

## Collections & Indexes

### `users`

| Field      | Type   | Notes                                 |
| ---------- | ------ | ------------------------------------- |
| `email`    | String | Required, unique, lowercase, trim     |
| `password` | String | Required — bcrypt hash                |
| `plan`     | String | `"FREE"` \| `"PRO"`, default `"FREE"` |

Indexes: `{ email: 1 }` unique

---

### `documents`

| Field              | Type     | Notes                                              |
| ------------------ | -------- | -------------------------------------------------- |
| `userId`           | ObjectId | Ref → `users`, required                            |
| `fileName`         | String   | Required (disk name)                               |
| `originalFileName` | String   | Optional — user-visible name                       |
| `mimeType`         | String   | Optional                                           |
| `sizeBytes`        | Number   | Optional                                           |
| `storage.path`     | String   | Absolute path under `FILE_STORAGE_PATH`            |
| `storage.provider` | String   | `"local"` (default)                                |
| `status`           | String   | `UPLOADED` → `PROCESSING` → `READY` / `FAILED`     |
| `progress.*`       | Object   | `totalPages`, `chunksTotal`, `chunksDone`, `stage` |
| `error.*`          | Object   | `message`, `at`                                    |

Indexes: `{ userId, createdAt }` · `{ userId, status }`

---

### `sessions`

| Field            | Type       | Notes                            |
| ---------------- | ---------- | -------------------------------- |
| `userId`         | ObjectId   | Ref → `users`, required          |
| `title`          | String     | Required, default `"New chat"`   |
| `selectedDocIds` | ObjectId[] | Refs → `documents`, default `[]` |

Indexes: `{ userId, updatedAt }`

---

### `messages`

| Field       | Type     | Notes                                            |
| ----------- | -------- | ------------------------------------------------ |
| `userId`    | ObjectId | Ref → `users`, required                          |
| `sessionId` | ObjectId | Ref → `sessions`, required                       |
| `role`      | String   | `"user"` \| `"assistant"` \| `"system"`          |
| `content`   | String   | Required                                         |
| `citations` | Array    | Optional: `{ docId, fileName, page?, chunkId? }` |
| `meta`      | Object   | Optional: `{ model?, latencyMs? }`               |

Indexes: `{ sessionId, createdAt }` · `{ userId, createdAt }`

---

### `query_logs` _(planned — schema defined, not yet written to)_

| Field               | Type     | Notes                       |
| ------------------- | -------- | --------------------------- |
| `userId`            | ObjectId | Ref → `users`, required     |
| `sessionId`         | ObjectId | Ref → `sessions`, required  |
| `query`             | String   | Required                    |
| `retrievedChunkIds` | String[] | Chunk IDs from vector store |
| `latencyMs`         | Number   | Optional                    |
| `tokens`            | Number   | Optional                    |

Indexes: `{ sessionId, createdAt }` · `{ userId, createdAt }`

---

## Environment Variables

`MONGO_URI` is now **required**. The server will refuse to start without it.

| Variable    | Required | Example                              |
| ----------- | -------- | ------------------------------------ |
| `MONGO_URI` | ✅       | `mongodb://localhost:27017/docvault` |

---

## Server Startup Behaviour

```
┌─ MongoDB running ──────────────────────────────────────────┐
│  [docvault-api] Mongo connected                            │
│  docvault-api  ✓  RUNNING  →  http://localhost:4000        │
└────────────────────────────────────────────────────────────┘

┌─ MongoDB NOT running ───────────────────────────────────────┐
│  [docvault-api] Mongo connection failed: <reason>           │
│  [docvault-api] Fatal startup error: <reason>               │
│  process exits with code 1                                  │
└────────────────────────────────────────────────────────────┘
```

---

## Full Schema Reference

See [`docvault-api/src/docs/data-model.md`](docvault-api/src/docs/data-model.md) for:

- Example JSON document per collection
- Field-level required / optional breakdown
- Collection relationship ER diagram
- Document status machine diagram

---

## What's NOT in This Step

- ❌ Auth routes (register / login / refresh)
- ❌ File upload logic
- ❌ RAG pipeline calls
- ❌ Any business logic / controllers / services

---

## Next Steps (Step 3 Onwards)

- Implement auth endpoints (register, login, JWT refresh)
- Add `bcryptjs` for password hashing
- Add `jsonwebtoken` for JWT signing / verification
- Protect routes with auth middleware
