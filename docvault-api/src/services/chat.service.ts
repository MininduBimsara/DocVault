import { Types } from "mongoose";
import {
  chatWithRag,
  RagChatMessage,
  RagChatSource,
} from "../clients/ragChat.client";
import {
  createMessage,
  listRecentMessagesBySessionForUser,
} from "../repositories/message.repository";
import {
  findSessionByIdForUser,
  touchSessionUpdatedAtForUser,
} from "../repositories/session.repository";

const HISTORY_LIMIT = 10;

interface CreateChatCompletionInput {
  userId: string;
  sessionId: string;
  question: string;
}

interface ChatResponse {
  answer: string;
  sources: RagChatSource[];
  sessionId: string;
}

function makeError(statusCode: number, message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
}

function toHistoryMessage(message: any): RagChatMessage {
  return {
    role: message.role,
    content: message.content,
  };
}

function sanitizeSources(sources: RagChatSource[]): RagChatSource[] {
  const cleaned: RagChatSource[] = [];
  for (const source of sources) {
    if (!Types.ObjectId.isValid(source.docId)) continue;
    if (!source.fileName || source.fileName.trim().length === 0) continue;

    cleaned.push({
      docId: source.docId,
      fileName: source.fileName,
      page: source.page,
      chunkId: source.chunkId,
      snippet: source.snippet,
    });
  }
  return cleaned;
}

export async function createChatCompletion(
  input: CreateChatCompletionInput,
): Promise<ChatResponse> {
  const session = await findSessionByIdForUser(input.sessionId, input.userId);
  if (!session) {
    throw makeError(404, "Session not found");
  }

  const docIds = (session.selectedDocIds ?? []).map((id: any) => String(id));

  const latestFirst = await listRecentMessagesBySessionForUser(
    input.userId,
    input.sessionId,
    HISTORY_LIMIT,
  );
  const history = latestFirst.reverse().map(toHistoryMessage);

  await createMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: "user",
    content: input.question,
  });
  await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

  let ragResponse;
  try {
    ragResponse = await chatWithRag({
      userId: input.userId,
      docIds,
      history,
      question: input.question,
    });
  } catch {
    throw makeError(502, "RAG chat request failed");
  }

  const sources = sanitizeSources(ragResponse.sources);

  await createMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: "assistant",
    content: ragResponse.answer,
    sources,
  });
  await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

  return {
    answer: ragResponse.answer,
    sources,
    sessionId: input.sessionId,
  };
}
