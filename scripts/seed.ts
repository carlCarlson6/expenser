/**
 * Seeds a development profile with ~6 months of realistic expenses, straight
 * against the database (no running server needed).
 *
 *   npm run db:seed -- <clerk_user_id> [--force]
 *   SEED_CLERK_USER_ID=user_xxx npm run db:seed
 *
 * Same command the admin endpoint runs; use `npm run admin -- seed-dev-user`
 * to go through HTTP instead.
 */
import { loadEnv } from "./load-env";

loadEnv();

import { seedDevUser } from "../src/modules/admin/domain/commands/seed-dev-user";
import { getDb } from "../src/shared/db/client";
import { createRepos, runInTransaction } from "../src/shared/db/repos";
import { formatCents } from "../src/shared/money/money";

const args = process.argv.slice(2);
const force = args.includes("--force");
const clerkUserId = args.find((a) => !a.startsWith("--")) ?? process.env.SEED_CLERK_USER_ID;

if (!clerkUserId) {
  console.error(
    "Usage: npm run db:seed -- <clerk_user_id> [--force]\n" +
      "   or: SEED_CLERK_USER_ID=user_xxx npm run db:seed",
  );
  process.exit(1);
}
const userId: string = clerkUserId;

async function main() {
  const db = getDb();
  const summary = await seedDevUser(
    createRepos(db),
    { clerkUserId: userId, force },
    (fn) => runInTransaction(db, fn),
  );

  const fmt = (cents: number) => formatCents(cents, summary.currency, "es-ES");
  console.log(`Profile ${summary.profileId}`);
  if (summary.missingCategories.length) {
    console.warn(`Categories not found (skipped): ${summary.missingCategories.join(", ")}`);
  }
  console.log(`Inserted ${summary.inserted} expenses over ${summary.months} months.\n`);

  console.log("By category:");
  for (const c of summary.byCategory) {
    console.log(`  ${c.name.padEnd(16)} ${String(c.count).padStart(4)}  ${fmt(c.totalCents)}`);
  }
  console.log(
    `  ${"TOTAL".padEnd(16)} ${String(summary.inserted).padStart(4)}  ${fmt(summary.totalCents)}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message === "alreadySeeded") {
      console.error("Re-run with --force to seed a profile that already has expenses.");
    }
    process.exit(1);
  });