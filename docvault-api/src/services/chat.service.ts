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
import { createReviewTask } from "../repositories/reviewTask.repository";

const HISTORY_LIMIT = 10;
const AUTO_CONF_THRESHOLD = 0.85;
const REFUSAL_THRESHOLD = 0.60;

interface CreateChatCompletionInput {
  userId: string;
  sessionId: string;
  question: string;
}

interface ChatResponse {
  answer: string;
  sources: RagChatSource[];
  sessionId: string;
  status: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
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
      similarityScore: source.similarityScore,
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
    true, // include pending drafts in history for reviewer visibility and conversation logic
  );
  const history = latestFirst.reverse().map(toHistoryMessage);

  await createMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: "user",
    content: input.question,
    status: "PUBLISHED",
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

  const confidence = ragResponse.confidenceScore;
  const sources = sanitizeSources(ragResponse.sources);

  if (confidence >= AUTO_CONF_THRESHOLD) {
    await createMessage({
      userId: input.userId,
      sessionId: input.sessionId,
      role: "assistant",
      content: ragResponse.answer,
      sources,
      status: "PUBLISHED",
    });
    await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

    return {
      answer: ragResponse.answer,
      sources,
      sessionId: input.sessionId,
      status: "PUBLISHED",
    };
  } else if (confidence >= REFUSAL_THRESHOLD) {
    const assistantMsg = await createMessage({
      userId: input.userId,
      sessionId: input.sessionId,
      role: "assistant",
      content: ragResponse.answer, // hold raw draft answer in MongoDB
      sources,
      status: "PENDING_REVIEW",
    });
    await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

    await createReviewTask({
      userId: input.userId,
      sessionId: input.sessionId,
      messageId: assistantMsg._id.toString(),
      question: input.question,
      draftAnswer: ragResponse.answer,
      sources: sources.map((s) => ({
        docId: s.docId,
        fileName: s.fileName,
        page: s.page,
        chunkId: s.chunkId,
        snippet: s.snippet,
        similarityScore: s.similarityScore,
      })),
      confidenceScore: confidence,
    });

    return {
      answer: "This response is undergoing verification by a system administrator.",
      sources: [],
      sessionId: input.sessionId,
      status: "PENDING_REVIEW",
    };
  } else {
    const refusalText = "I couldn't find enough relevant information in the selected documents to answer your question.";
    await createMessage({
      userId: input.userId,
      sessionId: input.sessionId,
      role: "assistant",
      content: refusalText,
      sources: [],
      status: "PUBLISHED",
    });
    await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

    return {
      answer: refusalText,
      sources: [],
      sessionId: input.sessionId,
      status: "PUBLISHED",
    };
  }
}
