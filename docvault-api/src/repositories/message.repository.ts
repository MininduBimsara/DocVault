import { Types } from "mongoose";
import { MessageRole } from "../models/message.model";
import Message from "../models/message.model";

interface MessageSourceInput {
  docId: string;
  fileName: string;
  page?: number;
  chunkId?: string;
  snippet?: string;
}

interface CreateMessageData {
  userId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  sources?: MessageSourceInput[];
}

export async function createMessage(data: CreateMessageData) {
  const sources = data.sources?.map((source) => ({
    docId: new Types.ObjectId(source.docId),
    fileName: source.fileName,
    page: source.page,
    chunkId: source.chunkId,
    snippet: source.snippet,
  }));

  return Message.create({
    userId: new Types.ObjectId(data.userId),
    sessionId: new Types.ObjectId(data.sessionId),
    role: data.role,
    content: data.content,
    sources,
  });
}

export async function listRecentMessagesBySessionForUser(
  userId: string,
  sessionId: string,
  limit: number,
) {
  return Message.find({
    userId: new Types.ObjectId(userId),
    sessionId: new Types.ObjectId(sessionId),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .select("_id role content sources createdAt")
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
