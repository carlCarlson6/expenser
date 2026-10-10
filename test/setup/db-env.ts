import { inject } from "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    /** Connection URI of the Testcontainers Postgres (see global-db.ts). */
    dbUrl: string;
  }
}

/**
 * Runs in every worker before the test files load: points the app's lazy
 * `getDb()` at the container started by `global-db.ts` instead of whatever
 * `DATABASE_URL` in `.env.local` refers to.
 */
process.env.DATABASE_URL = inject("dbUrl");
