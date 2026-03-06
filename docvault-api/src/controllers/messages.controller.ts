import { Request, Response, NextFunction } from "express";
import {
  createSessionMessage,
  listSessionMessages,
} from "../services/messages.service";
import {
  isValidObjectId,
  parseLimit,
  parseMessageContent,
  parseMessageRole,
} from "../validators/sessions.validator";

function serviceErrorStatus(err: unknown): number | undefined {
  return (err as any)?.statusCode;
}

export async function createMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { role, content } = req.body ?? {};

    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ error: "Invalid sessionId" });
      return;
    }

    const parsedRole = parseMessageRole(role);
    if (!parsedRole) {
      res
        .status(400)
        .json({ error: "role must be one of user|assistant|system" });
      return;
    }

    const parsedContent = parseMessageContent(content);
    if (!parsedContent) {
      res.status(400).json({ error: "content must be a non-empty string" });
      return;
    }

    const message = await createSessionMessage({
      userId,
      sessionId,
      role: parsedRole,
      content: parsedContent,
    });

    res.status(201).json({ message });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    next(err);
  }
}

export async function listMessagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ error: "Invalid sessionId" });
      return;
    }

    const limit = parseLimit(req.query.limit, 20);

    const messages = await listSessionMessages(userId, sessionId, limit);
    res.status(200).json({ messages });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    next(err);
  }
}
