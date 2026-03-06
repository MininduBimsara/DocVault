import { countOwnedDocsByIds } from "../repositories/document.repository";
import { deleteMessagesBySessionForUser } from "../repositories/message.repository";
import {
  createSession,
  deleteSessionByIdForUser,
  findSessionByIdForUser,
  listSessionsByUser,
  updateSessionByIdForUser,
} from "../repositories/session.repository";

interface SessionPayload {
  id: string;
  title: string;
  selectedDocIds: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

interface CreateSessionInput {
  userId: string;
  title?: string;
  selectedDocIds?: string[];
}

interface UpdateSessionInput {
  userId: string;
  sessionId: string;
  title?: string;
  selectedDocIds?: string[];
}

function makeError(statusCode: number, message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = statusCode;
  return err;
}

function toSessionPayload(session: any): SessionPayload {
  return {
    id: String(session._id),
    title: session.title,
    selectedDocIds: (session.selectedDocIds ?? []).map((id: any) => String(id)),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

async function assertDocOwnership(userId: string, selectedDocIds: string[]) {
  if (selectedDocIds.length === 0) return;

  const ownedCount = await countOwnedDocsByIds(userId, selectedDocIds);
  if (ownedCount !== selectedDocIds.length) {
    throw makeError(404, "One or more documents were not found");
  }
}

export async function createSessionForUser(
  input: CreateSessionInput,
): Promise<SessionPayload> {
  const title = input.title ?? "New chat";
  const selectedDocIds = input.selectedDocIds ?? [];

  await assertDocOwnership(input.userId, selectedDocIds);

  const session = await createSession({
    userId: input.userId,
    title,
    selectedDocIds,
  });

  return toSessionPayload(session);
}

export async function listUserSessions(userId: string): Promise<SessionPayload[]> {
  const sessions = await listSessionsByUser(userId);
  return sessions.map(toSessionPayload);
}

export async function getUserSession(
  userId: string,
  sessionId: string,
): Promise<SessionPayload> {
  const session = await findSessionByIdForUser(sessionId, userId);
  if (!session) {
    throw makeError(404, "Session not found");
  }

  return toSessionPayload(session);
}

export async function updateSessionForUser(
  input: UpdateSessionInput,
): Promise<SessionPayload> {
  if (input.selectedDocIds !== undefined) {
    await assertDocOwnership(input.userId, input.selectedDocIds);
  }

  const session = await updateSessionByIdForUser(input.sessionId, input.userId, {
    title: input.title,
    selectedDocIds: input.selectedDocIds,
  });

  if (!session) {
    throw makeError(404, "Session not found");
  }

  return toSessionPayload(session);
}

export async function deleteSessionForUser(
  userId: string,
  sessionId: string,
): Promise<void> {
  const deleted = await deleteSessionByIdForUser(sessionId, userId);

  if (!deleted) {
    throw makeError(404, "Session not found");
  }

  await deleteMessagesBySessionForUser(userId, sessionId);
}
