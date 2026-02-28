# DocVault Chat — Quick Start Guide

## Prerequisites

Make sure you have these installed on your machine:

- **Python 3.10+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)

To verify, open PowerShell and run:

```powershell
python --version    # Should show Python 3.10 or higher
node --version      # Should show v18 or higher
npm --version       # Should show 8 or higher
```

---

## First-Time Setup (Run Once)

### Backend (FastAPI)

Open PowerShell and run these commands **one by one**:

```powershell
# 1. Navigate to the backend folder
cd C:\Users\minin\Documents\GitHub\DocVault\backend

# 2. Create a Python virtual environment
python -m venv .venv

# 3. Activate the virtual environment
.venv\Scripts\Activate.ps1

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Create your local environment file
Copy-Item .env.example .env
```

### Frontend (Next.js)

Open a **second** PowerShell window and run:

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

You need **two PowerShell windows** — one for backend, one for frontend.

### Window 1 — Backend

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process
```

✔ Backend is now running at **http://localhost:8000**
✔ API docs at **http://localhost:8000/docs**
✔ Health check at **http://localhost:8000/health**

### Window 2 — Frontend

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\frontend
npm run dev
```

You should see:

```
▲ Next.js (turbopack)
- Local: http://localhost:3000
```

✔ Frontend is now running at **http://localhost:3000**

---

## Stopping the Servers

Press **Ctrl + C** in each PowerShell window to stop the server.

## Exiting the Virtual Environment

When you're done working and want to leave the Python virtual environment, just type:

```powershell
deactivate
```

Your prompt will change from `(.venv) PS C:\...` back to `PS C:\...` — that means you're out.

---

## Useful Commands Reference

### Backend Commands

| Command                                     | What it does                                            |
| ------------------------------------------- | ------------------------------------------------------- |
| `.venv\Scripts\Activate.ps1`                | Activate the virtual environment                        |
| `deactivate`                                | Deactivate the virtual environment                      |
| `pip install -r requirements.txt`           | Install/update Python packages                          |
| `uvicorn app.main:app --reload --port 8000` | Start the backend server (auto-reloads on code changes) |

### Frontend Commands

| Command         | What it does                               |
| --------------- | ------------------------------------------ |
| `npm install`   | Install/update Node packages               |
| `npm run dev`   | Start the frontend dev server              |
| `npm run build` | Build for production (to check for errors) |
| `npm run lint`  | Run the linter to check code quality       |

---

## Troubleshooting

### "venv cannot be created" or file lock errors

A previous Python process may be locking files. Fix:

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

Another process is using the port. Fix:

```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill it by PID (replace 12345 with the actual PID from above)
Stop-Process -Id 12345 -Force
```

### "Activate.ps1 cannot be loaded" (PowerShell execution policy)

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then try activating again.

### Frontend "next is not recognized"

Re-install dependencies:

```powershell
cd C:\Users\minin\Documents\GitHub\DocVault\frontend
Remove-Item node_modules -Recurse -Force
npm install
```
