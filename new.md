# DocVault — Quick Start Guide

## Prerequisites

Make sure you have these installed on your machine:

- **Python 3.10+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)
- **MongoDB** running locally on port `27017`

To verify, open PowerShell and run:

```powershell
python --version    # Should show Python 3.10 or higher
node --version      # Should show v18 or higher
npm --version       # Should show 8 or higher
```

---

## First-Time Setup (Run Once)

### Service 1 — docvault-rag (FastAPI / Python)

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
```

### Service 2 — docvault-api (Express / Node.js)

```powershell
# 1. Navigate to the API folder
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-api

# 2. Install Node dependencies
npm install

# 3. Create your local environment file
Copy-Item .env.example .env
```

### Service 3 — frontend (Next.js)

```powershell
# 1. Navigate to the frontend folder
cd C:\Users\minin\Documents\GitHub\DocVault\frontend

# 2. Install Node dependencies
npm install

# 3. Create your local environment file
Copy-Item .env.example .env
```

---

## Running the App (Every Day)

You need **three PowerShell windows** — one per service.

### Window 1 — docvault-rag (FastAPI backend)

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-rag
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process
```

✔ RAG service running at **http://localhost:8000**
✔ API docs at **http://localhost:8000/docs**
✔ Health check at **http://localhost:8000/health**

### Window 2 — docvault-api (Express backend)

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\docvault-api
npm run dev
```

You should see something like:

```
[docvault-api] Server running on http://localhost:4000
```

✔ API service running at **http://localhost:4000**

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

## Stopping the Servers

Press **Ctrl + C** in each PowerShell window to stop that service.

## Exiting the Virtual Environment (docvault-rag only)

When you're done with the FastAPI service, deactivate the venv:

```powershell
deactivate
```

Your prompt changes from `(.venv) PS C:\...` back to `PS C:\...`.

---

## Useful Commands Reference

### docvault-rag (FastAPI)

| Command                                     | What it does                            |
| ------------------------------------------- | --------------------------------------- |
| `.venv\Scripts\Activate.ps1`                | Activate the Python virtual environment |
| `deactivate`                                | Deactivate the virtual environment      |
| `pip install -r requirements.txt`           | Install/update Python packages          |
| `uvicorn app.main:app --reload --port 8000` | Start FastAPI (auto-reloads on changes) |

### docvault-api (Express)

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm install`   | Install/update Node packages         |
| `npm run dev`   | Start Express dev server (port 4000) |
| `npm run build` | Compile TypeScript to `dist/`        |
| `npm start`     | Run compiled production build        |

### Frontend (Next.js)

| Command         | What it does                               |
| --------------- | ------------------------------------------ |
| `npm install`   | Install/update Node packages               |
| `npm run dev`   | Start the frontend dev server (port 3000)  |
| `npm run build` | Build for production (to check for errors) |
| `npm run lint`  | Run the linter to check code quality       |

---

## Troubleshooting

### "venv cannot be created" or file lock errors

```powershell
# Kill any running Python processes
Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete old venv and recreate
Remove-Item .venv -Recurse -Force
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "port already in use" error

```powershell
# Find what's using a port (replace 8000 with 4000 or 3000 as needed)
netstat -ano | findstr :8000

# Kill it by PID (replace 12345 with the actual PID from above)
Stop-Process -Id 12345 -Force
```

### "Activate.ps1 cannot be loaded" (PowerShell execution policy)

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then try activating again.

### "next is not recognized" or "ts-node-dev not found"

Re-install dependencies in the relevant folder:

```powershell
Remove-Item node_modules -Recurse -Force
npm install
```
