import { Schema, model, Document, Types } from "mongoose";
import { WithTimestamps } from "../types/mongo";

// ── TypeScript interface ──────────────────────────────────────────────────────

export interface ISession extends Document, WithTimestamps {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  selectedDocIds: Types.ObjectId[];
}

// ── Schema ────────────────────────────────────────────────────────────────────

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: "New chat",
    },
    selectedDocIds: {
      type: [Schema.Types.ObjectId],
      ref: "Document",
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "sessions",
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────

SessionSchema.index({ userId: 1, updatedAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────

const Session = model<ISession>("Session", SessionSchema);
export default Session;
