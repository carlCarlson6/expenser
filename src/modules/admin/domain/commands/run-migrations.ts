/**
 * Applies the Drizzle migrations in `./drizzle` to the database behind
 * `DATABASE_URL`, using the same driver the app uses (postgres-js locally,
 * Neon over WebSockets in production).
 *
 * Equivalent to `npm run db:migrate`, except it runs in-process so the admin
 * endpoint can trigger it on a deployed environment.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle as drizzleNeonServerless } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeonServerless } from "drizzle-orm/neon-serverless/migrator";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import { migrate as migratePostgresJs } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { isNeonUrl } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";

export type MigrationDriver = "neon-websocket" | "postgres-js";

export type RunMigrationsInput = {
  /** Folder holding the generated .sql files. Defaults to `./drizzle`. */
  folder?: string;
};

export type RunMigrationsResult = {
  driver: MigrationDriver;
  folder: string;
  /** Migration files found on disk. */
  total: number;
  /** How many of them this run applied. */
  applied: number;
};

/** Drizzle's own bookkeeping table; used only to report the outcome. */
const COUNT_APPLIED = `select count(*)::int as count from drizzle.__drizzle_migrations`;

function countMigrationFiles(folder: string): number {
  if (!existsSync(folder)) {
    throw new Error(`Migrations folder not found: ${folder}`);
  }
  return readdirSync(folder).filter((f) => f.endsWith(".sql")).length;
}

/**
 * Applied migrations so far. Drizzle creates the table on the first run, so a
 * missing table simply means "none applied yet".
 */
async function countApplied(run: () => Promise<unknown>): Promise<number> {
  try {
    const result = await run();
    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: unknown[] }).rows ?? []);
    const row = rows[0] as { count?: number | string } | undefined;
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function runMigrations(
  input: RunMigrationsInput = {},
): Promise<RunMigrationsResult> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const folder = input.folder ?? join(process.cwd(), "drizzle");
  const total = countMigrationFiles(folder);

  if (isNeonUrl(url)) {
    const db = drizzleNeon(neon(url), { schema });
    const before = await countApplied(() => db.execute(sql.raw(COUNT_APPLIED)));
    await migrateNeon(db, { migrationsFolder: folder });
    const after = await countApplied(() => db.execute(sql.raw(COUNT_APPLIED)));
    return { driver: "neon-http", folder, total, applied: after - before };
  }

  const client = postgres(url);
  try {
    const db = drizzlePostgresJs(client, { schema });
    const before = await countApplied(() => db.execute(sql.raw(COUNT_APPLIED)));
    await migratePostgresJs(db, { migrationsFolder: folder });
    const after = await countApplied(() => db.execute(sql.raw(COUNT_APPLIED)));
    return { driver: "postgres-js", folder, total, applied: after - before };
  } finally {
    await client.end();
  }
}