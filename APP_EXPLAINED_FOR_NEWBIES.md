# DocVault Explained Simply

Think of DocVault as a team of 3 workers:

1. **Frontend (Next.js):** the screen the user clicks.
2. **API service (Express):** the organizer and rule enforcer.
3. **RAG service (FastAPI):** the document brain that reads chunks and drafts answers.

There are also two databases and a file store:

- **MongoDB** — saves users, documents, chat sessions, and messages.
- **PostgreSQL + pgvector** — stores vectorized document chunks for semantic search.
- **Shared folder (`shared-storage/`)** — holds the uploaded PDF files on disk.

---

## 1. Big Picture: What Happens End-to-End

User journey in one sentence:

> Register or log in → upload PDF → API saves file and metadata → RAG service chunks and embeds it into PGVector → user opens chat → API asks RAG for an answer from selected docs → API saves conversation → frontend shows answer with citations.

---

## 2. What Each Service Does

### Frontend (`frontend`)

- Shows login/register pages.
- Shows dashboard for uploading documents and tracking ingestion status.
- Shows the chat UI, sessions list, and source citations.
- Sends requests with cookies (`credentials: "include"`).

Important behaviors:
- Protected pages redirect to login when unauthenticated.
- Dashboard polls documents every 5 seconds so status changes appear automatically.
- Chat input is disabled until at least one document is selected for the active session.

### API (`docvault-api`)

- Verifies user identity (JWT in HttpOnly cookie).
- Stores business data in MongoDB.
- Saves PDF files to shared storage.
- Orchestrates the chat flow and persists messages with sources.
- Calls the RAG service through internal endpoints secured by `INTERNAL_RAG_KEY`.

### RAG (`docvault-rag`)

- Accepts ingestion jobs (`POST /ingest`) from the API.
- Loads and cleans PDF text with PyMuPDF.
- Chunks text, creates embeddings (Hugging Face, locally), upserts vectors into PGVector.
- During chat (`POST /rag/chat`), retrieves the most relevant chunks and generates context-only answers with Gemini.
- Deletes embeddings when a document is deleted (`DELETE /ingest/{docId}`).

---

## 3. New User Flow (Step-by-Step)

### A. Register / Login

1. User submits the form in the frontend.
2. API validates credentials (password is bcrypt-hashed).
3. API sets an HttpOnly JWT cookie.
4. Frontend calls the `/me` endpoint to restore the user session.
5. Protected pages become accessible.

### B. Upload PDF

1. User picks a PDF in the dashboard.
2. API pre-generates a document ID so the file path is known upfront.
3. API writes the file to `shared-storage/{userId}/{docId}.pdf`.
4. API creates a MongoDB document record with status `UPLOADED`.
5. API calls RAG `POST /ingest` with `userId`, `docId`, `filePath`, `fileName`.
6. If accepted, API sets status to `PROCESSING`.
7. RAG runs ingestion in the background and sends progress webhooks back to API.
8. API updates document progress/status (final states are `READY` or `FAILED`).
9. Frontend polling sees updates and refreshes status badges.

### C. Chat

1. User opens the chat page and selects a session.
2. User picks which documents to chat with for that session.
3. User asks a question.
4. Frontend shows the message immediately (optimistic UI).
5. API validates session ownership and saves the user message.
6. API sends an internal request to RAG `/rag/chat`.
7. RAG embeds the question with Hugging Face (local inference).
8. RAG queries PGVector — cosine ANN search filtered by `userId` + selected `docIds`.
9. RAG builds a prompt with conversation history + retrieved chunks and calls Gemini.
10. Answer + source citations are returned to the API.
11. API saves the assistant message with sources.
12. Frontend renders the answer with clickable citations.

---

## 4. Ingestion Pipeline in Plain English

When a PDF is ingested, the RAG service does this:

1. Opens the PDF and extracts text page by page (PyMuPDF).
2. Cleans noisy text (whitespace, repeated headers/footers).
3. Splits text into smaller overlapping chunks (~800 characters each).
4. Turns each chunk into a 384-dimensional numeric vector (Hugging Face, runs locally).
5. Saves each chunk's text + metadata + vector into PostgreSQL using the pgvector extension.
6. Notifies the API of each progress stage: `chunk` → `embed` → `done` (or `failed`).

**Why chunking + embeddings matter:**  
Instead of searching for exact words, the system finds semantically similar passages — so asking "What is the revenue?" can match a paragraph that says "Total earnings were $5M."

---

## 5. Chat Pipeline in Plain English

When a user asks a question:

1. API sends `userId`, selected `docIds`, recent `history`, and the `question` to RAG.
2. RAG computes an embedding for the question (same 384-dimensional vector space).
3. RAG queries PGVector for the top-5 closest chunks, filtered so only the current user's selected documents are searched.
4. RAG builds a prompt: conversation history + retrieved chunk text.
5. Gemini generates an answer **constrained only to the provided context** (no outside knowledge).
6. RAG returns `answer` + `sources` (doc name, page, snippet).
7. API stores the assistant message and returns everything to the frontend.

If nothing is selected or found:
- "I can't answer because no documents are selected for this session."
- "I couldn't find the answer in the selected documents."

---

## 6. Data and Security Basics

### Multi-tenant safety

- All MongoDB queries are scoped by authenticated `userId`.
- PGVector retrieval is filtered by both `userId` AND selected `docIds`.
- Internal service endpoints require `INTERNAL_RAG_KEY` (shared secret, never exposed to the browser).

### Auth model

- JWT is stored in an HttpOnly cookie — JavaScript on the page cannot read it (XSS protection).
- Frontend always sends cookies with API requests.
- Protected pages redirect unauthenticated users to login.

---

## 7. Where Things Are Saved

| What | Where |
|------|-------|
| Users, sessions, messages, document metadata | MongoDB |
| Uploaded PDF files | `shared-storage/{userId}/{docId}.pdf` |
| Document chunk text + embeddings | PostgreSQL `document_chunks` table (pgvector) |

---

## 8. Typical Failure Cases

| Failure | What the user sees |
|---------|-------------------|
| RAG service unavailable during upload | API rolls back (removes file + DB record) and returns a 502 error |
| Ingestion fails midway | Dashboard shows `FAILED` status with an error message |
| Chat called with invalid session | API returns 404 |
| No relevant chunks found | Assistant replies "couldn't find answer" with empty sources |

---

## 9. Mental Model for a New Team Member

If you remember only this:

1. **Frontend** is pure UI — no business logic.
2. **API** is the traffic controller and source of truth for users, sessions, messages, and document metadata.
3. **RAG** is a specialized worker for ingesting PDFs and answering questions with retrieved context.
4. **MongoDB** stores app records, **shared-storage** stores raw files, **PostgreSQL+pgvector** stores searchable vector knowledge.
