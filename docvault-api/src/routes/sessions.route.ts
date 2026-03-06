import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createSessionHandler,
  deleteSessionHandler,
  getSessionHandler,
  listSessionsHandler,
  updateSessionHandler,
} from "../controllers/sessions.controller";
import messagesRouter from "./messages.route";

const router = Router();

router.post("/", requireAuth, createSessionHandler);
router.get("/", requireAuth, listSessionsHandler);
router.get("/:sessionId", requireAuth, getSessionHandler);
router.patch("/:sessionId", requireAuth, updateSessionHandler);
router.delete("/:sessionId", requireAuth, deleteSessionHandler);

router.use("/:sessionId/messages", messagesRouter);

export default router;
