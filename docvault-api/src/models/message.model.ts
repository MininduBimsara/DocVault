import { Schema, model, Document, Types } from "mongoose";
import { WithTimestamps } from "../types/mongo";

// ── TypeScript interfaces ─────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface IMessageSource {
  docId: Types.ObjectId;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
  similarityScore?: number;
}

export interface IMessageMeta {
  model?: string;
  latencyMs?: number;
}

export interface IMessage extends Document, WithTimestamps {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  role: MessageRole;
  content: string;
  sources?: IMessageSource[];
  status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  meta?: IMessageMeta;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const SourceSchema = new Schema<IMessageSource>(
  {
    docId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    fileName: { type: String, required: true },
    page: Number,
    chunkId: String,
    snippet: String,
    similarityScore: Number,
  },
  { _id: false },
);

const MetaSchema = new Schema<IMessageMeta>(
  {
    model: String,
    latencyMs: Number,
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────

const MessageSchema = new Schema<IMessage>(
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
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: {
      type: [SourceSchema],
      default: undefined, // omit field entirely if not provided
    },
    status: {
      type: String,
      enum: ["PUBLISHED", "PENDING_REVIEW", "REJECTED"],
      default: "PUBLISHED",
      required: true,
    },
    meta: {
      type: MetaSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

MessageSchema.index({ sessionId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

const Message = model<IMessage>("Message", MessageSchema);
export default Message;
