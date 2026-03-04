import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload extends JwtPayload {
  sub: string; // userId
  email: string;
}

/**
 * Sign a JWT containing userId (sub) and email.
 * Expiry is controlled by JWT_EXPIRES_IN env var (default "7d").
 */
export function signToken(payload: { sub: string; email: string }): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError or TokenExpiredError on invalid/expired tokens —
 * callers must catch and return 401.
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
