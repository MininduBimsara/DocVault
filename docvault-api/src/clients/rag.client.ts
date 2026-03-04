import axios from "axios";
import { env } from "../config/env";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IngestPayload {
  userId: string;
  docId: string;
  filePath: string;
  fileName: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

const ragAxios = axios.create({
  baseURL: env.RAG_SERVICE_URL,
  timeout: 10_000, // 10 s — only for the initial trigger, not the full ingest
  headers: {
    "Content-Type": "application/json",
    INTERNAL_RAG_KEY: env.INTERNAL_RAG_KEY,
  },
});

/**
 * Trigger ingestion on the docvault-rag service.
 * Sends a POST /ingest with the document metadata.
 * Throws on non-2xx responses.
 */
export async function triggerIngest(payload: IngestPayload): Promise<void> {
  // Note: we deliberately do NOT log env.INTERNAL_RAG_KEY
  console.log(
    `[rag.client] triggering ingest docId=${payload.docId} userId=${payload.userId}`,
  );

  await ragAxios.post("/ingest", payload);
}
