import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import {
  drizzle as drizzlePostgresJs,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Drizzle client. Local development talks to the docker-compose Postgres via
 * postgres-js; production (Vercel + Neon) talks over Neon's HTTP driver. Both
 * expose the same query/transaction API, so we type everything as
 * `PostgresJsDatabase` and cast the Neon branch.
 */
export type Db = PostgresJsDatabase<typeof schema>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (url.includes("neon.tech") || url.includes("neon.build")) {
    return drizzleNeon(neon(url), { schema }) as unknown as Db;
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
