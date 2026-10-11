import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Public routes: landing page only (locale-prefixed or not). Auth now lives
// on the landing page via the embedded Clerk <SignIn> form.
const isPublicRoute = createRouteMatcher(["/", "/:locale"]);

// API routes authenticate on their own (see src/app/api/admin/route.ts) and
// live outside [locale], so next-intl must not rewrite them.
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) return;

  const { userId } = await auth();
  if (!userId && !isPublicRoute(req)) {
    // Unauthenticated users land on the marketing page, which hosts the
    // sign-in form, instead of getting a raw auth error.
    return NextResponse.redirect(new URL("/", req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|.*\\..*).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
