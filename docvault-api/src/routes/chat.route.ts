import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createChatCompletionHandler } from "../controllers/chat.controller";

const router = Router();

router.post("/", requireAuth, createChatCompletionHandler);

export default router;
