import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Works for both local Docker Postgres (plain TCP) and Neon (pooled connection
// string over TLS). On Vercel/Neon, attach the pool to Fluid compute via
// @vercel/functions if cold-start connection churn becomes an issue.
const pool = new Pool({
  connectionString: databaseUrl,
  // Neon requires TLS; local Docker does not provide it.
  ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool });
