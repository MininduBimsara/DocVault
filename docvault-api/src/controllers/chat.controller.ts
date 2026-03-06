import { Request, Response, NextFunction } from "express";
import { createChatCompletion } from "../services/chat.service";
import {
  isValidObjectId,
  parseMessageContent,
} from "../validators/sessions.validator";

const QUESTION_MAX_LENGTH = 4000;

function serviceErrorStatus(err: unknown): number | undefined {
  return (err as any)?.statusCode;
}

export async function createChatCompletionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { sessionId, question } = req.body ?? {};

    if (typeof sessionId !== "string" || !isValidObjectId(sessionId)) {
      res.status(400).json({ error: "sessionId must be a valid ObjectId" });
      return;
    }

    const parsedQuestion = parseMessageContent(question);
    if (!parsedQuestion) {
      res.status(400).json({ error: "question must be a non-empty string" });
      return;
    }

    if (parsedQuestion.length > QUESTION_MAX_LENGTH) {
      res
        .status(400)
        .json({
          error: `question must be <= ${QUESTION_MAX_LENGTH} characters`,
        });
      return;
    }

    const response = await createChatCompletion({
      userId,
      sessionId,
      question: parsedQuestion,
    });

    res.status(200).json(response);
  } catch (err: unknown) {
    const status = serviceErrorStatus(err);
    if (status === 404) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (status === 502) {
      res.status(502).json({ error: "RAG service unavailable" });
      return;
    }
    next(err);
  }
}
