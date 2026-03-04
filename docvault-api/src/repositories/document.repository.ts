import { Types } from "mongoose";
import DocVaultDocument from "../models/document.model";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateDocData {
  docId: Types.ObjectId; // pre-generated so the caller knows the path before save
  userId: string;
  fileName: string;
  status: "UPLOADED";
  storage: { provider: "local"; path: string };
}

export interface UpdateDocStorageData {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * Insert a new document record with a caller-supplied _id.
 * Because docId is pre-generated, storage.path is already the real path
 * so Mongoose's required validator is satisfied on the very first save.
 */
export async function createDoc(data: CreateDocData) {
  const doc = new DocVaultDocument({
    _id: data.docId,
    userId: new Types.ObjectId(data.userId),
    fileName: data.fileName,
    status: data.status,
    storage: data.storage,
    progress: {},
    error: {},
  });
  return doc.save();
}

/**
 * Patch a document record after the file has been saved.
 * Sets the final storage path, MIME type, file size, and progress stage.
 */
export async function updateDocStorage(
  docId: string,
  data: UpdateDocStorageData,
) {
  return DocVaultDocument.findByIdAndUpdate(
    docId,
    {
      $set: {
        "storage.path": data.storagePath,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        "progress.stage": "uploaded",
      },
    },
    { new: true },
  ).lean();
}

/**
 * Return all documents belonging to a user, newest first.
 * Never exposes storage.path or internal fields to callers.
 */
export async function findDocsByUser(userId: string) {
  return DocVaultDocument.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .select("_id fileName status progress createdAt")
    .lean();
}

/**
 * Fetch a single document validating that it belongs to the requesting user.
 * Returns null if not found OR if the userId doesn't match (multi-tenancy guard).
 */
export async function findDocById(docId: string, userId: string) {
  return DocVaultDocument.findOne({
    _id: new Types.ObjectId(docId),
    userId: new Types.ObjectId(userId),
  }).lean();
}

/**
 * Hard-delete a document record by its id.
 */
export async function deleteDoc(docId: string) {
  return DocVaultDocument.findByIdAndDelete(docId);
}
