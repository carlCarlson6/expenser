import "server-only";

import { auth } from "@clerk/nextjs/server";

import type { Result } from "@/shared/result";

/** Returns the Clerk user id. Use inside Server Actions and server components
 *  behind the (app) route group. */
export async function requireClerkUserId(): Promise<
  Result<string, "unauthorized">
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }
  return { ok: true, value: userId };
}
