import { Types } from "mongoose";

const MESSAGE_ROLES = new Set(["user", "assistant", "system"]);

export function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

export function normalizeTitle(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  return trimmed;
}

export function parseSelectedDocIds(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (!isValidObjectId(item)) return null;
    ids.push(item);
  }

  return [...new Set(ids)];
}

export function parseMessageRole(value: unknown):
  | "user"
  | "assistant"
  | "system"
  | null {
  if (typeof value !== "string") return null;
  if (!MESSAGE_ROLES.has(value)) return null;
  return value as "user" | "assistant" | "system";
}

export function parseMessageContent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export function parseLimit(value: unknown, fallback = 20): number {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(raw)) return fallback;
  if (raw < 1) return 1;
  if (raw > 100) return 100;
  return raw;
}
