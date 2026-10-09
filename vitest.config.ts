import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { loadEnv } from "./scripts/load-env";

loadEnv();

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./src/shared/testing/stub-server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
