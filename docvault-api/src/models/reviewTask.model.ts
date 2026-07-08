import { Schema, model, Document, Types } from "mongoose";

export type ReviewTaskStatus = "PENDING" | "APPROVED" | "REJECTED" | "EDITED";

export interface IReviewTask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  messageId: Types.ObjectId;
  question: string;
  draftAnswer: string;
  sources: Array<{
    docId: Types.ObjectId;
    fileName: string;
    page?: number;
    chunkId?: string;
    snippet?: string;
    similarityScore: number;
  }>;
  confidenceScore: number;
  status: ReviewTaskStatus;
  reviewedBy?: Types.ObjectId;
  finalAnswer?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewTaskSchema = new Schema<IReviewTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    question: { type: String, required: true },
    draftAnswer: { type: String, required: true },
    sources: [
      {
        docId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
        fileName: { type: String, required: true },
        page: Number,
        chunkId: String,
        snippet: String,
        similarityScore: { type: Number, required: true },
      },
    ],
    confidenceScore: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EDITED"],
      default: "PENDING",
      required: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    finalAnswer: String,
    reviewedAt: Date,
  },
  {
    timestamps: true,
    collection: "review_tasks",
  },
);

ReviewTaskSchema.index({ status: 1, createdAt: -1 });
ReviewTaskSchema.index({ userId: 1, status: 1 });

const ReviewTask = model<IReviewTask>("ReviewTask", ReviewTaskSchema);
export default ReviewTask;
