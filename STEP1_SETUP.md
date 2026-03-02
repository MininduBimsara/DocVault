# DocVault — Step 1: Infrastructure Baseline

## Overview

Two independent microservices with basic configuration, environment handling, and health routes.
No authentication, no upload logic, no RAG pipeline, no database models.

---

## Architecture

| Service        | Stack                            | Port   | Responsibility (future)                              |
| -------------- | -------------------------------- | ------ | ---------------------------------------------------- |
| `docvault-api` | Node.js · Express · TypeScript   | `4000` | Auth, users, document metadata, session management   |
| `docvault-rag` | Python 3.10+ · FastAPI · Uvicorn | `8000` | Embeddings, Chroma, ingestion, retrieval, generation |

---

## File Structure

```
DocVault/
├── shared-storage/                     ← shared volume; auto-created at startup
│
├── docvault-api/
│   ├── src/
│   │   ├── config/env.ts               ← dotenv + required-var validation
│   │   ├── routes/health.route.ts      ← GET /health
│   │   ├── app.ts                      ← Express setup (CORS, JSON, routes)
│   │   └── server.ts                   ← bootstrap, shared-storage mkdir, Mongo placeholder
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── docvault-rag/
    ├── app/
    │   ├── core/config.py              ← pydantic-settings, absolute path resolution
    │   ├── routes/health.py            ← GET /health
    │   └── main.py                     ← FastAPI app, lifespan, CORS
    ├── requirements.txt
    ├── .env.example
    ├── .gitignore
    └── README.md
```

---

## Setup & Running

### docvault-api (Terminal 1)

```powershell
cd docvault-api

# First time only
cp .env.example .env
npm install

# Start dev server
npm run dev
```

Available scripts:

| Script          | Command                             |
| --------------- | ----------------------------------- |
| `npm run dev`   | `ts-node-dev` hot-reload on `:4000` |
| `npm run build` | Compile TypeScript to `dist/`       |
| `npm start`     | Run compiled output                 |

---

### docvault-rag (Terminal 2)

```powershell
cd docvault-rag

# First time only
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS / Linux
cp .env.example .env
pip install -r requirements.txt

# Start dev server
uvicorn app.main:app --reload --port 8000
```

---

## Environment Variables

### docvault-api `.env`

| Variable            | Required | Default                 | Description                                 |
| ------------------- | -------- | ----------------------- | ------------------------------------------- |
| `PORT`              | ✅       | `4000`                  | Server port                                 |
| `MONGO_URI`         | ❌       | —                       | MongoDB URI (placeholder for Step 2)        |
| `JWT_SECRET`        | ❌       | —                       | JWT signing secret (placeholder for Step 2) |
| `RAG_SERVICE_URL`   | ✅       | `http://localhost:8000` | Base URL of docvault-rag                    |
| `INTERNAL_RAG_KEY`  | ❌       | —                       | Shared secret for inter-service calls       |
| `FILE_STORAGE_PATH` | ✅       | `../shared-storage`     | Relative path to shared storage             |

### docvault-rag `.env`

| Variable            | Required | Default                                  | Description                            |
| ------------------- | -------- | ---------------------------------------- | -------------------------------------- |
| `PORT`              | ✅       | `8000`                                   | Server port                            |
| `CHROMA_PATH`       | ✅       | `./chroma`                               | Chroma vector store path (placeholder) |
| `EMBEDDINGS_MODEL`  | ✅       | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model (placeholder)        |
| `INTERNAL_RAG_KEY`  | ❌       | —                                        | Shared secret for inter-service calls  |
| `FILE_STORAGE_PATH` | ✅       | `../shared-storage`                      | Relative path to shared storage        |

> Both services resolve `FILE_STORAGE_PATH` to an **absolute path** at startup and create the directory if it doesn't exist.

---

## Health Endpoints

```bash
# docvault-api
curl http://localhost:4000/health
# → { "status": "ok", "service": "docvault-api" }

# docvault-rag
curl http://localhost:8000/health
# → { "status": "ok", "service": "docvault-rag" }
```

---

## What's NOT in This Step

- ❌ Authentication / JWT
- ❌ MongoDB connection
- ❌ Chroma / embeddings
- ❌ File upload logic
- ❌ Any business logic

---

## Next Steps (Step 2 Onwards)

- Connect MongoDB in `docvault-api` (replace placeholder in `server.ts`)
- Define Mongoose models (User, Document)
- Implement auth routes (register, login)
- Wire Chroma and embeddings in `docvault-rag`
