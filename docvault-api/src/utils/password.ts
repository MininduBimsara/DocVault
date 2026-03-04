import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 * Use 12 rounds — good balance of security and speed (~300ms on modern hardware).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true if they match, false otherwise.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
