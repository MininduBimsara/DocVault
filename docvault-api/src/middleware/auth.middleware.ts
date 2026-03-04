import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import User from "../models/user.model";

/**
 * requireAuth — verifies the HttpOnly JWT cookie and attaches the safe user
 * object to req.user. Returns 401 for any auth failure.
 *
 * Attach this before any handler that requires an authenticated user.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token: string | undefined = req.cookies?.[env.COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyToken(token);

    // Load user from DB to ensure the account still exists
    const user = await User.findById(payload.sub).select("-password").lean();

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      plan: user.plan,
    };

    next();
  } catch {
    // Covers JsonWebTokenError, TokenExpiredError, etc.
    res.status(401).json({ error: "Not authenticated" });
  }
}
