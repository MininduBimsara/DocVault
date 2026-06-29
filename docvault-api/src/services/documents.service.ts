import fs from "fs/promises";
import { Types } from "mongoose";
import {
  createDoc,
  findDocsByUser,
  findDocById,
  deleteDoc,
} from "../repositories/document.repository";
import {
  resolveDocPath,
  ensureUserDir,
  removeFileSafe,
} from "../utils/fileStorage";
import { triggerIngest, deleteEmbeddings } from "../clients/rag.client";

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * 1. Pre-generate a Mongo ObjectId — so we know the final file path upfront.
 * 2. Ensure the user directory exists on disk.
 * 3. Write the PDF buffer to FILE_STORAGE_PATH/{userId}/{docId}.pdf.
 * 4. Create the DB record (status=UPLOADED).
 * 5. Patch mimeType, sizeBytes onto the saved record.
 * 6. Trigger FastAPI ingestion via POST /ingest.
 *    - On success → update status to PROCESSING and progress.stage to "queued".
 *    - On failure → keep status UPLOADED and throw a 502 upstream error.
 * 7. Return a safe summary — no storage.path exposed to the caller.
 */
export async function uploadDocument(
  userId: string,
  file: Express.Multer.File,
): Promise<{
  id: string;
  fileName: string;
  status: string;
  progress: object;
  createdAt: unknown;
}> {
  const docId = new Types.ObjectId();
  const docIdStr = String(docId);
  const filePath = resolveDocPath(userId, docIdStr);

  await ensureUserDir(userId);
  await fs.writeFile(filePath, file.buffer);

  const doc = await createDoc({
    docId,
    userId,
    fileName: file.originalname,
    status: "UPLOADED",
    storage: { provider: "local", path: filePath },
  });

  await doc.updateOne({
    $set: {
      mimeType: file.mimetype,
      sizeBytes: file.size,
      "progress.stage": "uploaded",
    },
  });

  try {
    await triggerIngest({
      userId,
      docId: docIdStr,
      filePath,
      fileName: file.originalname,
    });

    await doc.updateOne({
      $set: {
        status: "PROCESSING",
        "progress.stage": "queued",
      },
    });

    console.log(`[upload] ingestion triggered docId=${docIdStr} → PROCESSING`);

    return {
      id: docIdStr,
      fileName: doc.fileName,
      status: "PROCESSING",
      progress: { stage: "queued" },
      createdAt: (doc as any).createdAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[upload] ingestion trigger failed docId=${docIdStr}: ${message}`,
    );

    // Rollback: remove the orphaned file and DB record
    try {
      await removeFileSafe(filePath);
      await deleteDoc(docIdStr);
      console.warn(
        `[upload] rolled back docId=${docIdStr} (file + DB record removed)`,
      );
    } catch (rollbackErr) {
      console.error(`[upload] rollback failed docId=${docIdStr}:`, rollbackErr);
    }

    const upstream: any = new Error("Ingestion service unavailable.");
    upstream.statusCode = 502;
    throw upstream;
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listDocuments(userId: string) {
  const docs = await findDocsByUser(userId);
  return docs.map((d) => ({
    id: String(d._id),
    fileName: d.fileName,
    status: d.status,
    progress: d.progress,
    createdAt: (d as any).createdAt,
  }));
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Validates ownership, removes the PDF from disk, deletes vector embeddings
 * from PGVector, then deletes the DB record.
 */
export async function deleteDocument(
  userId: string,
  docId: string,
): Promise<void> {
  const doc = await findDocById(docId, userId);

  if (!doc) {
    const err = new Error("Document not found");
    (err as any).statusCode = 404;
    throw err;
  }

  // Remove file from disk (silently ignores ENOENT)
  if (doc.storage?.path) {
    await removeFileSafe(doc.storage.path);
  }

  // Delete vector embeddings from PGVector (non-fatal — warns on failure)
  await deleteEmbeddings(docId);

  // Hard-delete DB record
  await deleteDoc(docId);

  console.log(`[delete] docId=${docId} removed (file + embeddings + DB)`);
}
