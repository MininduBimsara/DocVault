import { Types } from "mongoose";
import { MessageRole } from "../models/message.model";
import Message from "../models/message.model";

interface MessageSourceInput {
  docId: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
  similarityScore?: number;
}

interface CreateMessageData {
  userId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  sources?: MessageSourceInput[];
  status?: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
}

export async function createMessage(data: CreateMessageData) {
  const sources = data.sources?.map((source) => ({
    docId: new Types.ObjectId(source.docId),
    fileName: source.fileName,
    page: source.page,
    chunkId: source.chunkId,
    snippet: source.snippet,
    similarityScore: source.similarityScore !== undefined ? source.similarityScore : 1.0,
  }));

  return Message.create({
    userId: new Types.ObjectId(data.userId),
    sessionId: new Types.ObjectId(data.sessionId),
    role: data.role,
    content: data.content,
    sources,
    status: data.status || "PUBLISHED",
  });
}

export async function listRecentMessagesBySessionForUser(
  userId: string,
  sessionId: string,
  limit: number,
  includeUnpublished: boolean = false,
) {
  const filter: any = {
    userId: new Types.ObjectId(userId),
    sessionId: new Types.ObjectId(sessionId),
  };

  if (!includeUnpublished) {
    filter.status = "PUBLISHED";
  } else {
    filter.status = { $in: ["PUBLISHED", "PENDING_REVIEW"] };
  }

  return Message.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .select("_id role content sources status createdAt")
    .lean();
}

export async function deleteMessagesBySessionForUser(
  userId: string,
  sessionId: string,
) {
  return Message.deleteMany({
    userId: new Types.ObjectId(userId),
    sessionId: new Types.ObjectId(sessionId),
  });
}
