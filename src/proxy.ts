import { clerkMiddleware } from "@clerk/nextjs/server";

// Runs Clerk's session middleware on every request. Route protection is
// enforced in the (app) route-group layout via auth.protect(), not by path
// matching here — see https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
