import { MessageRole } from "../models/message.model";
import {
  createMessage,
  listRecentMessagesBySessionForUser,
} from "../repositories/message.repository";
import {
  findSessionByIdForUser,
  touchSessionUpdatedAtForUser,
} from "../repositories/session.repository";

interface MessagePayload {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: unknown;
}

interface CreateMessageInput {
  userId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
}

function makeError(statusCode: number, message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
}

function toMessagePayload(message: any): MessagePayload {
  return {
    id: String(message._id),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

async function assertSessionOwnership(userId: string, sessionId: string) {
  const session = await findSessionByIdForUser(sessionId, userId);
  if (!session) {
    throw makeError(404, "Session not found");
  }
}

export async function createSessionMessage(
  input: CreateMessageInput,
): Promise<MessagePayload> {
  await assertSessionOwnership(input.userId, input.sessionId);

  const message = await createMessage({
    userId: input.userId,
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
  });

  await touchSessionUpdatedAtForUser(input.sessionId, input.userId);

  return toMessagePayload(message);
}

export async function listSessionMessages(
  userId: string,
  sessionId: string,
  limit: number,
): Promise<MessagePayload[]> {
  await assertSessionOwnership(userId, sessionId);

  const latestFirst = await listRecentMessagesBySessionForUser(
    userId,
    sessionId,
    limit,
  );

  return latestFirst.reverse().map(toMessagePayload);
}
