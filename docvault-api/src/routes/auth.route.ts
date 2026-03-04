import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", requireAuth, logout);

// GET /api/auth/me
router.get("/me", requireAuth, me);

export default router;
