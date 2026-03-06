import { Types } from "mongoose";
import Session from "../models/session.model";

interface CreateSessionData {
  userId: string;
  title: string;
  selectedDocIds: string[];
}

interface UpdateSessionData {
  title?: string;
  selectedDocIds?: string[];
}

export async function createSession(data: CreateSessionData) {
  return Session.create({
    userId: new Types.ObjectId(data.userId),
    title: data.title,
    selectedDocIds: data.selectedDocIds.map((id) => new Types.ObjectId(id)),
  });
}

export async function listSessionsByUser(userId: string) {
  return Session.find({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1, _id: -1 })
    .lean();
}

export async function findSessionByIdForUser(sessionId: string, userId: string) {
  return Session.findOne({
    _id: new Types.ObjectId(sessionId),
    userId: new Types.ObjectId(userId),
  }).lean();
}

export async function updateSessionByIdForUser(
  sessionId: string,
  userId: string,
  patch: UpdateSessionData,
) {
  const $set: Record<string, unknown> = {};

  if (patch.title !== undefined) {
    $set.title = patch.title;
  }

  if (patch.selectedDocIds !== undefined) {
    $set.selectedDocIds = patch.selectedDocIds.map(
      (id) => new Types.ObjectId(id),
    );
  }

  return Session.findOneAndUpdate(
    {
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    },
    { $set },
    { new: true },
  ).lean();
}

export async function touchSessionUpdatedAtForUser(
  sessionId: string,
  userId: string,
) {
  return Session.findOneAndUpdate(
    {
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    },
    { $set: { updatedAt: new Date() } },
    { new: true },
  ).lean();
}

export async function deleteSessionByIdForUser(sessionId: string, userId: string) {
  return Session.findOneAndDelete({
    _id: new Types.ObjectId(sessionId),
    userId: new Types.ObjectId(userId),
  }).lean();
}
