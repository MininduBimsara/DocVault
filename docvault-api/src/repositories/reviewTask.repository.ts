import { Types } from "mongoose";
import ReviewTask, { IReviewTask, ReviewTaskStatus } from "../models/reviewTask.model";

interface CreateReviewTaskInput {
  userId: string;
  sessionId: string;
  messageId: string;
  question: string;
  draftAnswer: string;
  sources: Array<{
    docId: string;
    fileName: string;
    page?: number;
    chunkId?: string;
    snippet?: string;
    similarityScore: number;
  }>;
  confidenceScore: number;
}

export async function createReviewTask(data: CreateReviewTaskInput) {
  const sources = data.sources.map((source) => ({
    docId: new Types.ObjectId(source.docId),
    fileName: source.fileName,
    page: source.page,
    chunkId: source.chunkId,
    snippet: source.snippet,
    similarityScore: source.similarityScore,
  }));

  return ReviewTask.create({
    userId: new Types.ObjectId(data.userId),
    sessionId: new Types.ObjectId(data.sessionId),
    messageId: new Types.ObjectId(data.messageId),
    question: data.question,
    draftAnswer: data.draftAnswer,
    sources,
    confidenceScore: data.confidenceScore,
    status: "PENDING",
  });
}

export async function listPendingReviewTasks() {
  return ReviewTask.find({ status: "PENDING" })
    .sort({ createdAt: -1 })
    .populate("userId", "email")
    .lean();
}

export async function findReviewTaskById(taskId: string) {
  return ReviewTask.findById(taskId).lean();
}

export async function updateReviewTaskStatus(
  taskId: string,
  reviewerId: string,
  status: ReviewTaskStatus,
  finalAnswer?: string,
) {
  return ReviewTask.findOneAndUpdate(
    { _id: new Types.ObjectId(taskId), status: "PENDING" },
    {
      $set: {
        status,
        reviewedBy: new Types.ObjectId(reviewerId),
        reviewedAt: new Date(),
        ...(finalAnswer !== undefined ? { finalAnswer } : {}),
      },
    },
    { new: true },
  ).lean();
}
