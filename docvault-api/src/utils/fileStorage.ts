import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

/**
 * Returns the absolute file path where a PDF document should be stored.
 * Pattern: FILE_STORAGE_PATH/{userId}/{docId}.pdf
 */
export function resolveDocPath(userId: string, docId: string): string {
  return path.join(env.FILE_STORAGE_PATH, userId, `${docId}.pdf`);
}

/**
 * Returns the absolute directory path for a user's documents.
 * Pattern: FILE_STORAGE_PATH/{userId}
 */
export function resolveUserDir(userId: string): string {
  return path.join(env.FILE_STORAGE_PATH, userId);
}

/**
 * Creates the user-specific directory under FILE_STORAGE_PATH if it does not
 * already exist (equivalent to mkdir -p).
 */
export async function ensureUserDir(userId: string): Promise<void> {
  const dir = resolveUserDir(userId);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Removes a file from disk. Silently ignores ENOENT (file already gone).
 * Throws for any other filesystem error.
 */
export async function removeFileSafe(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
