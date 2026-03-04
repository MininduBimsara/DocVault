import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";

/**
 * Internal-route authentication middleware.
 *
 * Reads the `INTERNAL_RAG_KEY` request header and compares it to the
 * configured secret using a constant-time comparison (timing-safe) to
 * prevent timing-oracle attacks.
 *
 * Returns 401 if the header is absent or the value doesn't match.
 * Never leaks the expected key value in any log or response.
 */
export function internalKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const provided = req.headers["internal_rag_key"] as string | undefined;

  if (!provided) {
    res.status(401).json({ error: "Missing INTERNAL_RAG_KEY header." });
    return;
  }

  // Constant-time comparison — prevent timing side-channel
  const expected = env.INTERNAL_RAG_KEY;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  // Buffers must be the same length for timingSafeEqual; reject early if not
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    res.status(401).json({ error: "Invalid INTERNAL_RAG_KEY." });
    return;
  }

  next();
}
