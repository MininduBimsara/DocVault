import { Request, Response, NextFunction } from "express";
import {
  listPendingReviewTasks,
  updateReviewTaskStatus,
} from "../repositories/reviewTask.repository";
import Message from "../models/message.model";

export async function listPendingReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tasks = await listPendingReviewTasks();
    res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function approveReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user!.id;

    const task = await updateReviewTaskStatus(taskId, reviewerId, "APPROVED");
    if (!task) {
      res.status(404).json({ error: "Pending review task not found or already processed" });
      return;
    }

    await Message.updateOne(
      { _id: task.messageId },
      { $set: { status: "PUBLISHED" } },
    );

    res.status(200).json({ success: true, message: "Response approved and published to chat session." });
  } catch (err) {
    next(err);
  }
}

export async function rejectReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user!.id;

    const task = await updateReviewTaskStatus(taskId, reviewerId, "REJECTED");
    if (!task) {
      res.status(404).json({ error: "Pending review task not found or already processed" });
      return;
    }

    await Message.updateOne(
      { _id: task.messageId },
      { $set: { status: "REJECTED", content: "This question was rejected or could not be verified by an administrator." } },
    );

    res.status(200).json({ success: true, message: "Response rejected." });
  } catch (err) {
    next(err);
  }
}

export async function editReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = req.params;
    const reviewerId = req.user!.id;
    const { finalAnswer } = req.body ?? {};

    if (typeof finalAnswer !== "string" || finalAnswer.trim().length === 0) {
      res.status(400).json({ error: "finalAnswer must be a non-empty string" });
      return;
    }

    const task = await updateReviewTaskStatus(taskId, reviewerId, "EDITED", finalAnswer.trim());
    if (!task) {
      res.status(404).json({ error: "Pending review task not found or already processed" });
      return;
    }

    await Message.updateOne(
      { _id: task.messageId },
      { $set: { status: "PUBLISHED", content: finalAnswer.trim() } },
    );

    res.status(200).json({ success: true, message: "Response updated and published." });
  } catch (err) {
    next(err);
  }
}
