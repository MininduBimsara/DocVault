/**
 * Lightweight API helper for the DocVault Chat backend.
 *
 * Uses NEXT_PUBLIC_BACKEND_URL from the environment (defaults to
 * http://localhost:8000 during local development).
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

/** Generic JSON fetcher. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** GET /health — returns { status: "ok" } when the backend is up. */
export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
