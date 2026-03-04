import { Request, Response } from "express";
import { env } from "../config/env";
import User from "../models/user.model";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

// ── Cookie options ────────────────────────────────────────────────────────────

/**
 * Shared cookie options.
 * sameSite "lax": browsers treat all localhost ports as same-site so this
 * works fine in dev (3001 → 4000). In production both services live under the
 * same apex domain so "lax" remains correct and more secure than "none".
 */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge, // milliseconds
  };
}

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return "A valid email address is required";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}

// ── Safe user payload for responses ──────────────────────────────────────────

function safeUser(user: InstanceType<typeof User>) {
  return {
    id: String(user._id),
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};

  const validationError = validateCredentials(email, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409).json({ error: "Email is already registered" });
    return;
  }

  const hashed = await hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase().trim(),
    password: hashed,
    plan: "FREE",
  });

  const token = signToken({ sub: String(user._id), email: user.email });
  res.cookie(env.COOKIE_NAME, token, cookieOptions(TOKEN_MAX_AGE_MS));

  res.status(201).json({ user: safeUser(user) });
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};

  const validationError = validateCredentials(email, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Generic message — avoids user enumeration
  const INVALID_MSG = "Invalid email or password";

  if (!user) {
    res.status(401).json({ error: INVALID_MSG });
    return;
  }

  const passwordOk = await verifyPassword(password, user.password);
  if (!passwordOk) {
    res.status(401).json({ error: INVALID_MSG });
    return;
  }

  const token = signToken({ sub: String(user._id), email: user.email });
  res.cookie(env.COOKIE_NAME, token, cookieOptions(TOKEN_MAX_AGE_MS));

  res.json({ user: safeUser(user) });
}

/**
 * POST /api/auth/logout
 * Clears the auth cookie by setting maxAge to 0.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.cookie(env.COOKIE_NAME, "", cookieOptions(0));
  res.json({ ok: true });
}

/**
 * GET /api/auth/me
 * requireAuth middleware runs first and attaches req.user.
 */
export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
