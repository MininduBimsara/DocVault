# DocVault — Quick Start Guide

## Prerequisites

Make sure you have these installed:

- **Docker Desktop** → [Download](https://www.docker.com/products/docker-desktop/) _(for databases)_
- **Python 3.10+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)

To verify, open PowerShell and run:

```powershell
python --version    # Should show Python 3.10 or higher
node --version      # Should show v18 or higher
npm --version       # Should show 8 or higher
docker --version    # Should show Docker 20 or higher
```

---

## First-Time Setup (Run Once)

### Step 0 — Start the databases

From the **repo root** (`DocVault/`), run:

```powershell
docker compose up -d
```

This starts:
- **PostgreSQL 16 + pgvector** on port `5432` (vector store for document embeddings)
- **MongoDB 7** on port `27017` (app metadata — users, sessions, messages, documents)

Both persist data in Docker volumes — they survive restarts.

To stop the databases: `docker compose down`  
To wipe data and start fresh: `docker compose down -v`

---

### Step 1 — docvault-rag (FastAPI / Python)

```powershell
# 1. Navigate to the RAG service folder
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-rag

# 2. Create a Python virtual environment
python -m venv .venv

# 3. Activate the virtual environment
.venv\Scripts\Activate.ps1

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Create your local environment file
Copy-Item .env.example .env
# Open .env and set GEMINI_API_KEY to your Google Gemini API key
# Get a free key at: https://aistudio.google.com/app/apikey
```

---

### Step 2 — docvault-api (Express / Node.js)

```powershell
# 1. Navigate to the API folder
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-api

# 2. Install Node dependencies
npm install

# 3. Create your local environment file
Copy-Item .env.example .env
# The defaults in .env.example work with the Docker databases out of the box
```

---

### Step 3 — frontend (Next.js)

```powershell
# 1. Navigate to the frontend folder
cd C:\Users\minin\Documents\GitHub\DocVault\frontend

# 2. Install Node dependencies
npm install
```

---

## Running the App (Every Day)

You need **three PowerShell windows** — one per service. The databases run in Docker in the background.

### Window 1 — docvault-rag (FastAPI backend)

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-rag
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

You should see:

```
┌────────────────────────────────────────────────────┐
│             docvault-rag  ✓  RUNNING               │
├────────────────────────────────────────────────────┤
│  URL           http://localhost:8000               │
│  PGVector      localhost:5432/docvault             │
│  File Storage  ...shared-storage                   │
└────────────────────────────────────────────────────┘
```

✔ RAG service running at **http://localhost:8000**  
✔ API docs at **http://localhost:8000/docs**

---

### Window 2 — docvault-api (Express backend)

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-api
npm run dev
```

You should see:

```
[docvault-api] Server running on http://localhost:4000
```

✔ API service running at **http://localhost:4000**

---

### Window 3 — Frontend (Next.js)

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\frontend
npm run dev
```

You should see:

```
▲ Next.js (turbopack)
- Local: http://localhost:3000
```

✔ Frontend running at **http://localhost:3000**

---

## Stopping Everything

Press **Ctrl + C** in each PowerShell window to stop the Node/Python services.

To stop the Docker databases: `docker compose down` (from the repo root)

To deactivate the Python venv (docvault-rag window only):

```powershell
deactivate
```

---

## Useful Commands Reference

### Databases (Docker)

| Command | What it does |
|---------|--------------|
| `docker compose up -d` | Start PostgreSQL + MongoDB in the background |
| `docker compose down` | Stop the databases |
| `docker compose down -v` | Stop and delete all data (fresh start) |
| `docker compose ps` | Check if containers are running |
| `docker exec -it docvault-postgres psql -U docvault -d docvault` | Open a PostgreSQL shell |

### docvault-rag (FastAPI)

| Command | What it does |
|---------|--------------|
| `.venv\Scripts\Activate.ps1` | Activate the Python virtual environment |
| `deactivate` | Deactivate the virtual environment |
| `pip install -r requirements.txt` | Install/update Python packages |
| `python -m uvicorn app.main:app --reload --port 8000` | Start FastAPI (auto-reloads on changes) |

### docvault-api (Express)

| Command | What it does |
|---------|--------------|
| `npm install` | Install/update Node packages |
| `npm run dev` | Start Express dev server (port 4000) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |

### Frontend (Next.js)

| Command | What it does |
|---------|--------------|
| `npm install` | Install/update Node packages |
| `npm run dev` | Start the frontend dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run lint` | Run the linter |

---

## Troubleshooting

### Docker containers not starting

```powershell
# Check container status and logs
docker compose ps
docker compose logs postgres
docker compose logs mongodb
```

### "venv cannot be created" or file lock errors

```powershell
Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item .venv -Recurse -Force
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "port already in use" error

```powershell
# Find what's using a port (replace 8000 with 4000 or 3000 as needed)
netstat -ano | findstr :8000

# Kill it by PID
Stop-Process -Id 12345 -Force
```

### "Activate.ps1 cannot be loaded" (PowerShell execution policy)

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "next is not recognized" or "ts-node-dev not found"

```powershell
Remove-Item node_modules -Recurse -Force
npm install
```
