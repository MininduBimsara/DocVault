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

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * 1. Pre-generate a Mongo ObjectId — so we know the final file path upfront.
 * 2. Ensure the user directory exists on disk.
 * 3. Write the PDF buffer to FILE_STORAGE_PATH/{userId}/{docId}.pdf.
 * 4. Create the DB record in a single save with storage.path already set
 *    (satisfies Mongoose's required validator on first write).
 * 5. Patch mimeType, sizeBytes, and progress.stage onto the saved record.
 * 6. Return a safe summary — no storage.path exposed to the caller.
 */
export async function uploadDocument(
  userId: string,
  file: Express.Multer.File,
) {
  // Step 1 — generate the _id upfront so the path is deterministic
  const docId = new Types.ObjectId();
  const docIdStr = String(docId);
  const filePath = resolveDocPath(userId, docIdStr);

  // Step 2 — ensure user's directory exists (idempotent)
  await ensureUserDir(userId);

  // Step 3 — write PDF buffer to disk
  await fs.writeFile(filePath, file.buffer);

  // Step 4 — persist the DB record with the real storage.path
  const doc = await createDoc({
    docId,
    userId,
    fileName: file.originalname,
    status: "UPLOADED",
    storage: { provider: "local", path: filePath },
  });

  // Step 5 — set mimeType, sizeBytes, progress.stage in-place
  await doc.updateOne({
    $set: {
      mimeType: file.mimetype,
      sizeBytes: file.size,
      "progress.stage": "uploaded",
    },
  });

  // Step 6 — return safe client-facing shape
  return {
    id: docIdStr,
    fileName: doc.fileName,
    status: doc.status,
    progress: { stage: "uploaded" },
    createdAt: (doc as any).createdAt,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Returns all documents owned by the user (newest first).
 * The repository projection never includes storage.path.
 */
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
 * Validates ownership, removes the PDF from disk, then deletes the DB record.
 * Throws a 404 error if the document is not found or doesn't belong to the user.
 */
export async function deleteDocument(
  userId: string,
  docId: string,
): Promise<void> {
  // Ownership check — findDocById already filters by userId (multi-tenancy guard)
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

  // TODO: Later: call RAG service to delete embeddings

  // Hard-delete DB record
  await deleteDoc(docId);
}
