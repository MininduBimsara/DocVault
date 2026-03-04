import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import { env } from "../config/env";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES =
  (parseInt(process.env.MAX_UPLOAD_MB ?? "25", 10) || 25) * 1024 * 1024;

// ── PDF filter ────────────────────────────────────────────────────────────────

function pdfOnly(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const extOk = path.extname(file.originalname).toLowerCase() === ".pdf";
  const mimeOk = file.mimetype === "application/pdf";

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("INVALID_FILE_TYPE"));
  }
}

// ── Multer instance (memory storage — we control final path after docId is known) ──

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: pdfOnly,
});

/**
 * Single-file upload middleware. Expects form field named `file`.
 * Puts the buffer on req.file for the controller to consume.
 */
export const uploadSingle = upload.single("file");

/**
 * Error handler that must be placed immediately after uploadSingle in the
 * route chain. Translates multer errors to clean JSON responses.
 */
export function handleMulterError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!err) {
    next();
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res
        .status(413)
        .json({
          error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
        });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  // Our custom file-type rejection
  if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
    res.status(400).json({ error: "Only PDF files are accepted." });
    return;
  }

  next(err);
}
