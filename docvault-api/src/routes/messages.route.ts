import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createMessageHandler,
  listMessagesHandler,
} from "../controllers/messages.controller";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, createMessageHandler);
router.get("/", requireAuth, listMessagesHandler);

export default router;
