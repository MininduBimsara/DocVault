import { Request, Response, NextFunction } from "express";
import {
  createSessionForUser,
  deleteSessionForUser,
  getUserSession,
  listUserSessions,
  updateSessionForUser,
} from "../services/sessions.service";
import {
  isValidObjectId,
  normalizeTitle,
  parseSelectedDocIds,
} from "../validators/sessions.validator";

function serviceErrorStatus(err: unknown): number | undefined {
  return (err as any)?.statusCode;
}

export async function createSessionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body ?? {};

    const title =
      body.title === undefined ? "New chat" : normalizeTitle(body.title);
    if (body.title !== undefined && !title) {
      res.status(400).json({ error: "title must be a non-empty string" });
      return;
    }

    const selectedDocIds = parseSelectedDocIds(body.selectedDocIds);
    if (selectedDocIds === null) {
      res
        .status(400)
        .json({ error: "selectedDocIds must be an array of valid ObjectIds" });
      return;
    }

    const session = await createSessionForUser({
      userId,
      title,
      selectedDocIds,
    });

    res.status(201).json({ session });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session or documents not found" });
      return;
    }
    next(err);
  }
}

export async function listSessionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const sessions = await listUserSessions(userId);
    res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function getSessionHandler(
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

    const session = await getUserSession(userId, sessionId);
    res.status(200).json({ session });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    next(err);
  }
}

export async function updateSessionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const body = req.body ?? {};

    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ error: "Invalid sessionId" });
      return;
    }

    if (body.title === undefined && body.selectedDocIds === undefined) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }

    const title =
      body.title === undefined ? undefined : normalizeTitle(body.title);
    if (body.title !== undefined && !title) {
      res.status(400).json({ error: "title must be a non-empty string" });
      return;
    }

    const selectedDocIds =
      body.selectedDocIds === undefined
        ? undefined
        : parseSelectedDocIds(body.selectedDocIds);

    if (body.selectedDocIds !== undefined && selectedDocIds === null) {
      res
        .status(400)
        .json({ error: "selectedDocIds must be an array of valid ObjectIds" });
      return;
    }

    const session = await updateSessionForUser({
      userId,
      sessionId,
      title,
      selectedDocIds: selectedDocIds ?? undefined,
    });

    res.status(200).json({ session });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session or documents not found" });
      return;
    }
    next(err);
  }
}

export async function deleteSessionHandler(
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

    await deleteSessionForUser(userId, sessionId);
    res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    next(err);
  }
}
