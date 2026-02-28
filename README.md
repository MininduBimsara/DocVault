# DocVault Chat

A multi-user RAG-powered document chat application. Upload documents, ask questions, and get answers grounded in your own files — powered by LLMs and vector search.

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Frontend     | Next.js (App Router) · TypeScript · Tailwind CSS |
| Backend      | FastAPI · Python 3.10+                           |
| Database     | MongoDB                                          |
| Vector Store | Chroma (local)                                   |
| File Storage | Local disk (dev)                                 |

## Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.10 and **pip**
- **MongoDB** (optional for Phase 0 — not connected yet)

## Quick Start

### 1. Clone & enter the repo

```bash
git clone <repo-url>
cd docvault-chat          # or whatever your repo root is called
```

### 2. Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env and edit as needed
cp .env.example .env

# Run the dev server
uvicorn app.main:app --reload --port 8000
```

Health check: open **http://localhost:8000/health** → `{ "status": "ok" }`

API docs: **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env

# Run the dev server
npm run dev
```

Open **http://localhost:3000** to see the landing page.

### 4. Verify connectivity

The utility function in `frontend/src/lib/api.ts` exposes `checkHealth()` which calls `GET /health` on the backend. You can test it from a browser console or a simple script once both servers are running.

## Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── api/          # Route modules
│   │   │   └── health.py
│   │   ├── core/         # Config, logging, shared utilities
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   └── main.py       # FastAPI entry point
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
├── frontend/             # Next.js App Router project
│   ├── src/
│   │   ├── app/          # Pages & layouts
│   │   └── lib/          # Utilities (api.ts)
│   ├── .env.example
│   └── package.json
├── shared/               # Docs & specs (no runtime coupling)
├── Makefile              # Convenience commands
├── .gitignore
└── README.md
```

## Available Make Commands

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `make backend-run`      | Start FastAPI dev server    |
| `make frontend-run`     | Start Next.js dev server    |
| `make backend-install`  | Install Python dependencies |
| `make frontend-install` | Install Node dependencies   |
| `make install`          | Install all dependencies    |

## License

Private — all rights reserved.
