import { Request, Response, NextFunction } from "express";
import { updateDocProgress } from "../repositories/document.repository";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressBody {
  stage?: string;
  totalPages?: number;
  chunksTotal?: number;
  chunksDone?: number;
  status?: "PROCESSING" | "READY" | "FAILED";
  errorMessage?: string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

/**
 * POST /internal/docs/:docId/progress
 *
 * Called by docvault-rag to report ingestion progress.
 * Protected by internalKeyMiddleware — not exposed to regular users.
 *
 * Body fields are all optional; only provided fields are written.
 * Idempotent: repeated calls just overwrite with the latest values.
 */
export async function progressHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { docId } = req.params;
    const body = req.body as ProgressBody;

    console.log(
      `[internal] progress update docId=${docId} stage=${body.stage ?? "-"} status=${body.status ?? "-"}`,
    );

    await updateDocProgress(docId, {
      stage: body.stage,
      totalPages: body.totalPages,
      chunksTotal: body.chunksTotal,
      chunksDone: body.chunksDone,
      status: body.status,
      errorMessage: body.errorMessage,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
