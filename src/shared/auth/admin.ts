/**
 * Authentication for the admin endpoint: a shared secret from
 * `ADMIN_API_KEY`, sent by the caller in the `x-admin-key` header.
 *
 * No key configured means the endpoint is disabled (503) — that is the kill
 * switch, so a deploy that never sets the variable simply cannot be called.
 */

import { timingSafeEqual } from "node:crypto";

export const ADMIN_KEY_HEADER = "x-admin-key";

export type AdminAuth =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, and the length is not a secret.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireAdminKey(request: Request): AdminAuth {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return { ok: false, status: 503, error: "adminApiDisabled" };

  const provided = request.headers.get(ADMIN_KEY_HEADER) ?? "";
  if (!keysMatch(provided, expected)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}