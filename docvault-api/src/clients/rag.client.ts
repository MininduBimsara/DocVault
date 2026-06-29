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
  console.log(
    `[rag.client] triggering ingest docId=${payload.docId} userId=${payload.userId}`,
  );
  await ragAxios.post("/ingest", payload);
}

/**
 * Delete all vector embeddings for a document from PGVector.
 * Sends a DELETE /ingest/{docId}.
 * Non-fatal: logs a warning on failure so document deletion still succeeds
 * even if the RAG service is temporarily unreachable.
 */
export async function deleteEmbeddings(docId: string): Promise<void> {
  try {
    console.log(`[rag.client] deleting embeddings docId=${docId}`);
    await ragAxios.delete(`/ingest/${docId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[rag.client] failed to delete embeddings docId=${docId}: ${message}`,
    );
  }
}
