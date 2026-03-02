import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "docvault-api" });
});

export default router;
