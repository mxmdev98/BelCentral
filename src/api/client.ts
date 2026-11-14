// src/api/client.ts — thin fetch wrapper. Sends credentials (cookies) on every
// request so the httpOnly JWT cookie is forwarded automatically.
import type { ApiError } from "../types";

// In dev: Vite proxies /api → http://localhost:4000 (see vite.config.ts).
// In production: either set VITE_BACKEND_URL to the API's full origin
//   (e.g. https://api.yourdomain.com) for cross-origin, OR leave it unset
//   to use /api (requires a reverse proxy rule that routes /api/* → backend).
const BASE = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : "/api";

export class ApiRequestError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // send/receive cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (body ?? {}) as ApiError;
    throw new ApiRequestError(res.status, err.error ?? "Request failed", err.details);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
