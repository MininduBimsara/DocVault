/**
 * Auth API client — all requests include credentials (cookies).
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export interface SafeUser {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail ?? `API error ${res.status}`);
  }
  return data as T;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<SafeUser> {
  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<SafeUser>(res);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<SafeUser> {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<SafeUser>(res);
}

export async function logoutUser(): Promise<{ ok: boolean }> {
  const res = await fetch(`${BACKEND_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse<{ ok: boolean }>(res);
}

export async function fetchMe(): Promise<SafeUser> {
  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    credentials: "include",
  });
  return handleResponse<SafeUser>(res);
}
