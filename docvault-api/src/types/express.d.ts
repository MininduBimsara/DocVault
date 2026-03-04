import { IUser } from "../models/user.model";

/**
 * Safe user shape attached to req.user — never contains the password field.
 */
export interface SafeUser {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
