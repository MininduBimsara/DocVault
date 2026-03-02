import { Schema, model, Document, Types } from "mongoose";
import { WithTimestamps } from "../types/mongo";

// ── TypeScript interface ──────────────────────────────────────────────────────

export interface IUser extends Document, WithTimestamps {
  _id: Types.ObjectId;
  email: string;
  password: string; // bcrypt-hashed value; field name is intentionally "password"
  plan: "FREE" | "PRO";
}

// ── Schema ────────────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["FREE", "PRO"],
      default: "FREE",
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email unique index is already defined via `unique: true` on the field above.

// ── Model ─────────────────────────────────────────────────────────────────────

const User = model<IUser>("User", UserSchema);
export default User;
