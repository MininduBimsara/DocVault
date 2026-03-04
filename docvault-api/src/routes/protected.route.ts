import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/protected/ping
 * A minimal protected endpoint to prove auth end-to-end works.
 * Remove or keep as a health-check-with-auth in future steps.
 */
router.get("/ping", requireAuth, (req: Request, res: Response) => {
  res.json({ ok: true, user: req.user });
});

export default router;
