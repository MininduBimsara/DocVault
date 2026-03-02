import { Types } from "mongoose";

/**
 * Convenience alias for Mongoose's ObjectId type.
 * Use this in interfaces and function signatures instead of the full path.
 */
export type MongoId = Types.ObjectId;

/**
 * Mixin for documents that use Mongoose's { timestamps: true } option.
 * Both fields are injected automatically by Mongoose.
 */
export interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}
