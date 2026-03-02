import { Schema, model, Document, Types } from "mongoose";
import { WithTimestamps } from "../types/mongo";

// ── TypeScript interfaces ─────────────────────────────────────────────────────

export interface IDocumentStorage {
  path: string;
  provider: "local";
}

export interface IDocumentProgress {
  totalPages?: number;
  chunksTotal?: number;
  chunksDone?: number;
  /** Processing stage: e.g. "extract" | "chunk" | "embed" | "upsert" */
  stage?: string;
}

export interface IDocumentError {
  message?: string;
  at?: Date;
}

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface IDocument extends Document, WithTimestamps {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  storage: IDocumentStorage;
  status: DocumentStatus;
  progress: IDocumentProgress;
  error: IDocumentError;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const StorageSchema = new Schema<IDocumentStorage>(
  {
    path: { type: String, required: true },
    provider: { type: String, enum: ["local"], default: "local" },
  },
  { _id: false },
);

const ProgressSchema = new Schema<IDocumentProgress>(
  {
    totalPages: Number,
    chunksTotal: Number,
    chunksDone: Number,
    stage: String,
  },
  { _id: false },
);

const ErrorSchema = new Schema<IDocumentError>(
  {
    message: String,
    at: Date,
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: String,
    mimeType: String,
    sizeBytes: Number,
    storage: {
      type: StorageSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "READY", "FAILED"],
      default: "UPLOADED",
    },
    progress: {
      type: ProgressSchema,
      default: () => ({}),
    },
    error: {
      type: ErrorSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: "documents",
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ userId: 1, status: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────

const DocVaultDocument = model<IDocument>("Document", DocumentSchema);
export default DocVaultDocument;
