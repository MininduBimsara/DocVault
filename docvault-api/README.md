# docvault-api

**Stack:** Node.js · Express · TypeScript  
**Port:** `4000`

Handles user authentication, document metadata, session management, and orchestrates calls to the RAG service.

---

## Quick Start

```bash
# 1. Copy env file
cp .env.example .env
# → Set JWT_SECRET and INTERNAL_RAG_KEY

# 2. Install dependencies
npm install

# 3. Run development server (requires MongoDB on :27017 — use docker compose up -d)
npm run dev
```

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register with email + password |
| `POST` | `/api/auth/login` | — | Login — sets HttpOnly JWT cookie |
| `POST` | `/api/auth/logout` | — | Clear auth cookie |
| `GET` | `/api/auth/me` | ✅ | Get current user info |

### Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/documents/upload` | ✅ | Upload PDF (max 25 MB); triggers background ingestion |
| `GET` | `/api/documents` | ✅ | List user's documents with status + progress |
| `DELETE` | `/api/documents/:docId` | ✅ | Delete document, file, and vector embeddings |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/sessions` | ✅ | Create a new chat session |
| `GET` | `/api/sessions` | ✅ | List all sessions for the current user |

### Messages / Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/messages` | ✅ | Send a chat message (calls RAG, saves answer + sources) |
| `GET` | `/api/sessions/:id/messages` | ✅ | Get conversation history for a session |

### Internal (RAG service → API)

| Method | Path | Key | Description |
|--------|------|-----|-------------|
| `POST` | `/internal/docs/:docId/progress` | `INTERNAL_RAG_KEY` | Ingestion progress webhook |

---

## Document Status Flow

```
UPLOADED → PROCESSING → READY
                     ↘ FAILED
```

Progress fields: `stage` (uploaded / queued / chunk / embed / done / failed), `chunksTotal`, `chunksDone`.

---

## Environment Variables

| Variable              | Required | Description |
|-----------------------|----------|-------------|
| `PORT`                | ✅ | Server port (default `4000`) |
| `MONGO_URI`           | ✅ | MongoDB connection string |
| `JWT_SECRET`          | ✅ | JWT signing secret (use a long random string) |
| `JWT_EXPIRES_IN`      | ❌ | Token TTL (default `7d`) |
| `COOKIE_NAME`         | ❌ | Cookie name (default `docvault_token`) |
| `FRONTEND_ORIGIN`     | ✅ | CORS allowed origin (e.g. `http://localhost:3000`) |
| `RAG_SERVICE_URL`     | ✅ | Base URL of docvault-rag (default `http://localhost:8000`) |
| `INTERNAL_RAG_KEY`    | ✅ | Shared secret for internal service calls |
| `RAG_CHAT_TIMEOUT_MS` | ❌ | Timeout for `/rag/chat` calls (default `20000`) |
| `FILE_STORAGE_PATH`   | ✅ | Path to shared PDF storage (default `../shared-storage`) |
| `MAX_UPLOAD_MB`       | ❌ | Max upload size in MB (default `25`) |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | `ts-node-dev` hot-reload on `:4000` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |

---

## Health Check

```bash
curl http://localhost:4000/health
# → { "status": "ok", "service": "docvault-api" }
```
