import { defineConfig } from "drizzle-kit";

import { loadEnv } from "./scripts/load-env";

// drizzle-kit does not load .env.local automatically — do it manually so
// `db:generate` / `db:migrate` work with the same env files as Next.js.
loadEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/*/data/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
