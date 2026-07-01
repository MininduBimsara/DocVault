# How to Run DocVault Locally — Step-by-Step Guide

This guide will walk you through everything you need to do to get DocVault running on your computer. No prior experience required — just follow each step in order.

---

## What is DocVault?

DocVault is an app that lets you **upload PDF documents and chat with them using AI**. You upload a PDF, the app reads it, and then you can ask questions about what's inside the document. It uses Google's Gemini AI to answer your questions based only on your uploaded documents.

The app has **four parts** that all need to be running at the same time:

| Part | What it does | Runs on |
|------|-------------|---------|
| **Neon DB** (Cloud Database) | Stores document embeddings for AI search | Cloud (HTTPS / Port 443) |
| **MongoDB** (Local Database) | Stores users, chat sessions, messages, document info | Port 27017 |
| **docvault-rag** (Python) | Reads PDFs, creates searchable embeddings, talks to Google Gemini AI | Port 8000 |
| **docvault-api** (Node.js) | Handles user accounts, login/logout, file uploads, chat sessions | Port 4000 |
| **frontend** (Next.js) | The website you see and interact with in your browser | Port 3000 |

---

## What You Need to Install First (Prerequisites)

Before you start, make sure you have these installed on your computer:

### 1. MongoDB 7 (Local Database)

MongoDB stores users, chat sessions, messages, and document metadata.

- **Download:** [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) — select **version 7.x**, **Windows**, and **MSI package**
- Run the installer:
  - Choose **Complete** installation
  - Check **"Install MongoDB as a Service"** — this makes it start automatically when your computer boots
  - Leave the default data and log directories
  - Optionally install **MongoDB Compass** (a GUI tool to browse your database visually)
- After installation, MongoDB will run automatically on port **27017**

#### Verify MongoDB is running

Open PowerShell and type:
```powershell
mongosh --eval "db.adminCommand('ping')"
```
You should see `{ ok: 1 }`. This means MongoDB is running. If it's not recognized, make sure you started the MongoDB service or added it to your PATH.

---

### 2. Node.js (version 18 or higher)

Node.js runs the API server and the frontend.

- **Download:** [https://nodejs.org/](https://nodejs.org/) — download the **LTS** version
- During installation, keep the default settings checked
- To verify it's installed, open PowerShell and type:
  ```
  node --version
  ```
  You should see something like `v20.x.x` or higher.

---

### 3. Python (version 3.10 or higher)

Python runs the RAG service (the AI/document processing part).

- **Download:** [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **IMPORTANT:** During installation, check the box that says **"Add Python to PATH"** — this is very important!
- To verify it's installed, open PowerShell and type:
  ```
  python --version
  ```
  You should see something like `Python 3.10.x` or higher.

---

### 4. Git (Optional)

Used to clone the repository. If you already have the files on your computer, you can skip this.

- **Download:** [https://git-scm.com/downloads](https://git-scm.com/downloads)

---

## Step 1: Get Your Google Gemini API Key (FREE)

DocVault uses Google's Gemini AI to answer questions. You need a free API key:

1. Go to **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click the **"Create API key"** button
4. Your API key will appear (e.g., `AIzaSyA...`)
5. **Copy this key and save it somewhere safe** — you'll need it in Step 4

---

## Step 2: Get Your Neon DB PostgreSQL URL (FREE)

Instead of compiling pgvector locally on Windows (which is very difficult and requires Visual Studio Build Tools), DocVault supports **Neon DB**. Neon is a cloud database that comes with `pgvector` pre-installed and runs over HTTPS (bypassing any network firewalls on port 5432).

### How to get it:

1. Go to **[https://neon.tech](https://neon.tech)** and sign up for a free account.
2. Create a new project (e.g. name it `docvault`).
3. Under the dashboard, copy the **Connection string** (select the **pooled** connection string if visible). It looks like:
   `postgresql://neondb_owner:npg_...your_password...@ep-wild-heart-...neon.tech/neondb?sslmode=require`
4. Copy the connection string. Open your database configuration:
   - Make sure to **remove** `&channel_binding=require` or `?channel_binding=require` from the end of the connection string if present.
   - Append `&options=endpoint%3Dep-your-endpoint-id` to the connection string (replace `ep-your-endpoint-id` with your actual endpoint ID, e.g. `ep-wild-heart-atsqbdms-pooler` or `ep-wild-heart-atsqbdms`). This ensures the python service routes properly.

Your final connection string in `.env` should look like this:
```
POSTGRES_URL=postgresql://neondb_owner:npg_JZKw9tCL7kmH@ep-wild-heart-atsqbdms-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-wild-heart-atsqbdms-pooler
```

---

## Step 3: Make Sure MongoDB is Running

Confirm local MongoDB is running:
- Open the Windows **Services** app (search "Services" in the Start menu).
- Find **MongoDB Agent** or **MongoDB Database Server**.
- If it says "Running", you're good. If not, right-click and choose **Start**.

---

## Step 4: Set Up and Start the RAG Service (Python)

This service handles PDF processing and AI chat.

### 4.1 — Navigate to the folder in PowerShell
```powershell
cd C:\path\to\DocVault\docvault-rag
```

### 4.2 — Create a Python virtual environment (first time only)
```powershell
python -m venv .venv
```

### 4.3 — Activate the virtual environment
```powershell
.\.venv\Scripts\Activate.ps1
```
> **Trouble activating?** If you get a "scripts disabled" error, run this first:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 4.4 — Install Python packages (first time only)
```powershell
pip install -r requirements.txt
```

### 4.5 — Set up the environment file
Copy the example file:
```powershell
copy .env.example .env
```
Open the `.env` file in a text editor (like Notepad) and change these lines:
- **Set your Gemini API key:**
  ```
  GEMINI_API_KEY=AIzaSyATgobf...your_full_key_here
  ```
- **Set your Neon DB connection string:**
  ```
  POSTGRES_URL=postgresql://neondb_owner:npg_JZKw9tCL7kmH@ep-wild-heart-atsqbdms-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-wild-heart-atsqbdms-pooler
  ```
- **Set the internal shared key:**
  Set `INTERNAL_RAG_KEY` to any secret password you want (e.g. `my_super_secret_key_123`). This must match the API configuration in Step 5.

### 4.6 — Start the RAG service
```powershell
python -m uvicorn app.main:app --reload --port 8000
```
You should see a banner confirming the server is running on `http://127.0.0.1:8000`.

---

## Step 5: Set Up and Start the API Service (Node.js)

This service handles user accounts, login, document uploads, and chat sessions. Open a **new PowerShell window**.

### 5.1 — Navigate to the folder
```powershell
cd C:\path\to\DocVault\docvault-api
```

### 5.2 — Install packages (first time only)
```powershell
npm install
```

### 5.3 — Set up the environment file
Copy the example file:
```powershell
copy .env.example .env
```
Open the `.env` file and make these changes:
- **Set the JWT secret:**
  Change `JWT_SECRET` to any long random string (e.g. `my_very_long_random_string_abc123xyz789`).
- **Set the shared RAG key (MUST match Step 4):**
  Change `INTERNAL_RAG_KEY` to the exact same key you chose in Step 4.
- **Fix the frontend origin:**
  Make sure this line says port `3000` (not `3001`):
  `FRONTEND_ORIGIN=http://localhost:3000`

### 5.4 — Start the API service
```powershell
npm run dev
```
You should see output saying `docvault-api ✓ RUNNING` on port `4000`.

---

## Step 6: Set Up and Start the Frontend (Next.js)

Open a **new PowerShell window**.

### 6.1 — Navigate to the folder
```powershell
cd C:\path\to\DocVault\frontend
```

### 6.2 — Install packages (first time only)
```powershell
npm install
```

### 6.3 — Start the frontend
```powershell
npm run dev
```
The website is now running at **http://localhost:3000**.

---

## Step 7: Open the App and Create an Account

1. Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**
2. You'll be redirected to the login/register screen.
3. Click "Sign up" or go to [http://localhost:3000/register](http://localhost:3000/register) to create an account.
4. Enter an email and password (must be at least 8 characters) and click **Register**.
5. Once registered, log in at [http://localhost:3000/login](http://localhost:3000/login) and start uploading PDFs and chatting!

---

## Quick Summary — All Commands in Order

```powershell
# Terminal 1 — RAG service (Python)
cd C:\path\to\DocVault\docvault-rag
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — API service (Node.js)
cd C:\path\to\DocVault\docvault-api
npm run dev

# Terminal 3 — Frontend (Next.js)
cd C:\path\to\DocVault\frontend
npm run dev
```


