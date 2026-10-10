import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

import { runMigrations } from "@/modules/admin/domain/commands/run-migrations";

/**
 * Boots an ephemeral Postgres (Docker via Testcontainers) for the test run and
 * applies the Drizzle migrations before any test file loads. Every test talks
 * to this instance — there are no fake repositories.
 *
 * The URI travels to the test workers through `project.provide("dbUrl", …)`;
 * `test/setup/db-env.ts` copies it into `process.env.DATABASE_URL` so the
 * app's `getDb()` connects to the container.
 */
export default async function setup(project: TestProject) {
  const container = await startPostgres();
  const url = container.getConnectionUri();

  process.env.DATABASE_URL = url;
  await runMigrations();
  project.provide("dbUrl", url);

  return async () => {
    await container.stop();
  };
}

/**
 * `postgres:16-alpine` mirrors `docker-compose.yml`. A start failure is
 * almost always a stopped Docker daemon, so say so instead of surfacing the
 * raw socket error.
 */
async function startPostgres() {
  try {
    return await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("expenser")
      .start();
  } catch (error) {
    throw new Error(
      "Could not start the Testcontainers Postgres — is Docker running? (`npm test` needs Docker)",
      { cause: error },
    );
  }
}
