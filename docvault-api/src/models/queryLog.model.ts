import { Schema, model, Document, Types } from "mongoose";
import { WithTimestamps } from "../types/mongo";

// ── TypeScript interface ──────────────────────────────────────────────────────

export interface IQueryLog extends Document, WithTimestamps {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  query: string;
  /** Chunk IDs returned from the vector store (Pinecone / Chroma etc.) */
  retrievedChunkIds: string[];
  latencyMs?: number;
  tokens?: number;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const QueryLogSchema = new Schema<IQueryLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    retrievedChunkIds: {
      type: [String],
      default: [],
    },
    latencyMs: Number,
    tokens: Number,
  },
  {
    timestamps: true,
    collection: "query_logs",
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

QueryLogSchema.index({ sessionId: 1, createdAt: -1 });
QueryLogSchema.index({ userId: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

const QueryLog = model<IQueryLog>("QueryLog", QueryLogSchema);
export default QueryLog;
