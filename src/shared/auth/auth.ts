import "server-only";

import { auth } from "@clerk/nextjs/server";

/** Returns the Clerk user id or throws. Use inside Server Actions and
 *  server components behind the (app) route group. */
export async function requireClerkUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
