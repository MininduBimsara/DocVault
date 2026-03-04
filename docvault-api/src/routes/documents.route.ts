import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  uploadSingle,
  handleMulterError,
} from "../middleware/upload.middleware";
import {
  uploadDocumentHandler,
  listDocumentsHandler,
  deleteDocumentHandler,
} from "../controllers/documents.controller";

const router = Router();

// POST /api/documents/upload — multipart PDF upload
router.post(
  "/upload",
  requireAuth,
  uploadSingle,
  handleMulterError,
  uploadDocumentHandler,
);

// GET /api/documents — list the caller's documents
router.get("/", requireAuth, listDocumentsHandler);

// DELETE /api/documents/:docId — remove a document (file + DB record)
router.delete("/:docId", requireAuth, deleteDocumentHandler);

export default router;
