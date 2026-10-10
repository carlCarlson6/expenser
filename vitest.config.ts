import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { loadEnv } from "./scripts/load-env";

loadEnv();

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
      "@test": fileURLToPath(new URL("./test/", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./src/shared/testing/stub-server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        // Pure logic; no database, no Docker.
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      {
        // Real repositories against an ephemeral Testcontainers Postgres.
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["test/integration/**/*.test.ts"],
          globalSetup: ["./test/setup/global-db.ts"],
          setupFiles: ["./test/setup/db-env.ts"],
        },
      },
    ],
  },
});
