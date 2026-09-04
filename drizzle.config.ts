import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/**/infrastructure/*.schema.ts",
  out: "./src/db/migrations",
  strict: true,
  verbose: true,
  dbCredentials: {
    // Migrations must use the direct (unpooled) connection on Neon.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
