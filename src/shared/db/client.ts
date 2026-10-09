import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonServerless } from "drizzle-orm/neon-serverless";
import {
  drizzle as drizzlePostgresJs,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Drizzle client. Local development talks to the docker-compose Postgres via
 * postgres-js; production (Vercel + Neon) talks to Neon over WebSockets.
 *
 * Neon also ships an HTTP driver (`neon-http`), which is faster for one-shot
 * queries but cannot open a transaction — and both `delete-category` and
 * `seed-dev-user` need one (drizzle's migrator does too), so Neon always gets
 * the WebSocket driver. Both drivers expose the same query/transaction API, so
 * we type everything as `PostgresJsDatabase` and cast the Neon branch.
 */
export type Db = PostgresJsDatabase<typeof schema>;

/** Hostnames served by Neon's serverless proxy (direct or `-pooler`). */
export function isNeonUrl(url: string): boolean {
  return url.includes("neon.tech") || url.includes("neon.build");
}

/** Neon over WebSockets needs the global `WebSocket` (Node 22+). */
function assertWebSocketAvailable(): void {
  if (typeof WebSocket === "undefined") {
    throw new Error(
      "Connecting to Neon needs Node 22+ (global WebSocket); the HTTP driver cannot run transactions",
    );
  }
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (isNeonUrl(url)) {
    assertWebSocketAvailable();
    const pool = new Pool({ connectionString: url });
    return drizzleNeonServerless(pool, { schema }) as unknown as Db;
  }
  return drizzlePostgresJs(postgres(url), { schema });
}

let cached: Db | undefined;

export function getDb(): Db {
  if (!cached) {
    cached = createDb();
  }
  return cached;
}