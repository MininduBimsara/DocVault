# docvault-api

**Stack:** Node.js · Express · TypeScript  
**Port:** `4000`

## Responsibility

Handles auth, users, document metadata, and session management (future steps).  
This is the **Step 1 baseline** — only configuration and health route wired up.

## Quick Start

```bash
# 1. Copy env file
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

## Health Check

```bash
curl http://localhost:4000/health
# → { "status": "ok", "service": "docvault-api" }
```

## Env Variables

| Variable            | Required | Description                             |
| ------------------- | -------- | --------------------------------------- |
| `PORT`              | ✅       | Server port (default 4000)              |
| `MONGO_URI`         | ❌       | MongoDB connection (placeholder)        |
| `JWT_SECRET`        | ❌       | JWT signing secret (placeholder)        |
| `RAG_SERVICE_URL`   | ✅       | Base URL of the docvault-rag service    |
| `INTERNAL_RAG_KEY`  | ❌       | Shared secret for internal comms        |
| `FILE_STORAGE_PATH` | ✅       | Relative path to the shared-storage dir |

## Scripts

| Script          | Command                |
| --------------- | ---------------------- |
| `npm run dev`   | ts-node-dev hot reload |
| `npm run build` | Compile to `dist/`     |
| `npm start`     | Run compiled output    |
