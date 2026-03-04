import { Router } from "express";
import { internalKeyMiddleware } from "../middleware/internalKey.middleware";
import { progressHandler } from "../controllers/internal.controller";

const router = Router();

// POST /internal/docs/:docId/progress
// Called by docvault-rag via INTERNAL_RAG_KEY — not user-facing
router.post("/docs/:docId/progress", internalKeyMiddleware, progressHandler);

export default router;
