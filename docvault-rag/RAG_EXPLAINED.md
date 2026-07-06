# RAG Explained: A Guide for Beginners

Welcome to the RAG service of DocVault! This document explains what **RAG** (Retrieval-Augmented Generation) is, how DocVault's pipeline works today, and why our proposed improvements will make it faster, safer, and much better at answering questions.

---

## 1. What is RAG?

Imagine taking a history exam:
* **Traditional LLM (Closed-Book):** The model relies entirely on what it memorized during training. If you ask it about a specific internal PDF document you uploaded 5 minutes ago, it cannot know the answer because it has never seen it.
* **RAG (Open-Book):** When you ask a question, the system searches through your uploaded documents, finds the pages containing the relevant information, copies those paragraphs, and pastes them into a "cheat sheet" (context). It then hands this cheat sheet to the LLM (Gemini) along with your question and says: *"Answer the question using only the paragraphs below."*

RAG allows AI models to answer questions accurately about your private files without needing to retrain the model.

---

## 2. How DocVault's RAG Works Today

DocVault divides the open-book exam into two major phases:

### Phase A: Uploading and Storing (Ingestion)
1. **Loading:** The system reads an uploaded PDF file page-by-page.
2. **Cleaning:** It removes headers, footers, and page numbers so they don't clutter the text.
3. **Chunking (Splitting):** An LLM cannot read a 100-page document all at once. The system cuts the text into smaller, overlapping snippets called **chunks**.
4. **Embedding (Generating Math Vectors):** To search text quickly, the computer converts words into a list of numbers called an **embedding**. Think of an embedding as a GPS coordinate in a map of meanings. Similar sentences (e.g. *"Install the software"* and *"How do I setup the program"*) will have coordinates close to each other on this map.
5. **Storing:** The chunks and their coordinates (vectors) are saved into a database (PostgreSQL with `pgvector`).

### Phase B: Asking Questions (Retrieval & Generation)
1. **Searching (Retrieving):** When you type a question, DocVault converts your question into a GPS coordinate (embedding) and asks the database: *"Give me the top 5 chunks closest to this coordinate."*
2. **Prompting:** DocVault inserts those 5 chunks and your question into a structured prompt.
3. **Answering (Generating):** Gemini reads the prompt and writes an answer based strictly on the chunks.

---

## 3. Explaining Our Suggested Improvements (In Simple Terms)

Below is a breakdown of the weaknesses we found and how our proposed changes will fix them.

---

### Category 1: Retrieval Quality (Finding the Right Information)

#### 1. Page-by-Page Split Issues
* **The Problem:** Currently, the system cuts text page-by-page. If a paragraph starts on page 4 and finishes on page 5, the sentence is cut in half. The system gets two broken fragments, losing the overall meaning.
* **The Fix:** We will use **Cross-Page Chunking**, which merges the pages first and splits them based on punctuation (like periods and paragraph breaks) instead of arbitrary page lines.

#### 2. Vector-Only Search Misses Specific Words
* **The Problem:** The database only searches by "general meaning" (vectors). If you search for an exact word, acronym, or code (like `ID-904`), vector search might miss it and return chunks about general IDs.
* **The Fix:** We will implement **Hybrid Search**. This combines vector search (meaning) with keyword search (exact spelling) to get the best of both worlds.

#### 3. No Relevance Filter (Similarity Threshold)
* **The Problem:** If you ask a question that is completely unrelated to your documents, the system still retrieves the 5 "closest" chunks it can find and sends them to Gemini. Gemini gets confused by the irrelevant text and might hallucinate a fake answer.
* **The Fix:** We will add a **Relevance Filter** (Similarity Threshold). If the best match in the database is too far from the question's meaning, the system stops immediately and tells you: *"I couldn't find any relevant information."*

#### 4. No "Memory" for Follow-Up Questions
* **The Problem:** If you ask: *"What is DocVault?"* and then ask: *"How do I install it?"*, the database searches literally for the word *"it"*. It doesn't know *"it"* refers to *"DocVault"*, resulting in useless search results.
* **The Fix:** We will add a **Query Rewriter**. Before searching, Gemini will combine your chat history and your question into a single clear question, rewriting *"How do I install it?"* to *"How do I install DocVault?"*.

---

### Category 2: Generation Quality (How the Answer Looks)

#### 5. Broken Formatting (The Whitespace Collapse Bug)
* **The Problem:** There is a line of code in the program that actively removes all newlines and indentation from Gemini's response. Because of this, if Gemini generates a nice list, code block, or table, it gets squashed into a single, massive, hard-to-read paragraph.
* **The Fix:** We will **delete** this cleanup step so you get fully formatted lists and markdown in the chat window.

---

### Category 3: Performance and Speed

#### 6. Database Ingestion Bottleneck (One-by-One Saving)
* **The Problem:** When saving chunks to the database, the system currently sends them one by one. If a PDF has 100 chunks, the system makes 100 consecutive requests to the database server. This is like going to the supermarket and buying 100 items by checking out and paying for each item separately! It makes uploading files incredibly slow.
* **The Fix:** We will implement **Batch Saving** (Bulk Upsert), which sends all 100 items to the database in a single request.

#### 7. Synchronous Code Blocks the Server
* **The Problem:** The server processes requests "synchronously" (one at a time, step-by-step). If User A is waiting for Gemini to generate a response (which takes 3 seconds), User B's request is completely frozen in line.
* **The Fix:** We will convert the database and LLM calls to use **Async** programming. This allows the server to multitask, handling hundreds of users at the same time.

---

### Category 4: Safety and Security

#### 8. Direct File Path Vulnerability
* **The Problem:** The system accepts any file path you send it. A malicious user could theoretically tell the system to read a critical system file (like `C:\Windows\System32\...`) instead of a PDF in the shared storage directory, causing a leak of sensitive server data.
* **The Fix:** We will add **Path Validation**. The system will refuse to open any file that does not reside strictly within the dedicated `shared-storage` directory.

#### 9. SQL Injection Risk
* **The Problem:** The system currently constructs database queries by manually replacing placeholders with text. If a document name has malicious SQL commands in it, it could trick the database into deleting tables or exposing data.
* **The Fix:** We will switch to **Parameterized Queries**, where the database driver separates SQL instructions from the raw input data.
