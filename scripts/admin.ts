/**
 * Calls the admin endpoint.
 *
 *   npm run admin -- migrate
 *   npm run admin -- seed-dev-user [clerk_user_id] [--force] [--months=6]
 *   npm run admin -- commands
 *
 * Env:
 *   ADMIN_API_KEY         (required) sent as the x-admin-key header
 *   ADMIN_API_URL         (optional) defaults to http://localhost:3000
 *   SEED_CLERK_USER_ID    (optional) default clerk user for seed-dev-user
 */
import { loadEnv } from "./load-env";

loadEnv();

import { formatCents } from "../src/shared/money/money";

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Flags = {};
  for (const arg of argv) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (!match) {
      positional.push(arg);
      continue;
    }
    flags[match[1]] = match[2] ?? true;
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const command = positional[0];

const key = (typeof flags.key === "string" ? flags.key : undefined) ?? process.env.ADMIN_API_KEY;
const baseUrl =
  (typeof flags.url === "string" ? flags.url : undefined) ??
  process.env.ADMIN_API_URL ??
  "http://localhost:3000";

if (!command || command === "--help" || flags.help) {
  console.error(
    "Usage: npm run admin -- <command> [args] [--url=…] [--key=…]\n" +
      "\n" +
      "  migrate                          apply pending db migrations\n" +
      "  seed-dev-user [clerk_user_id]    seed a dev profile\n" +
      "                                  [--force] [--months=6]\n" +
      "  commands                         list the endpoint's commands\n" +
      "\n" +
      "Env: ADMIN_API_KEY (required), ADMIN_API_URL, SEED_CLERK_USER_ID",
  );
  process.exit(command ? 0 : 1);
}

if (!key) {
  console.error("ADMIN_API_KEY is not set (or pass --key=…)");
  process.exit(1);
}

const headers = { "content-type": "application/json", "x-admin-key": key };

async function main() {
  if (command === "commands") {
    const response = await fetch(`${baseUrl}/api/admin`, { headers });
    return report(response);
  }

  const params: Record<string, unknown> = {};
  if (command === "seed-dev-user") {
    const clerkUserId =
      positional[1] ??
      (typeof flags["clerk-user-id"] === "string" ? flags["clerk-user-id"] : undefined) ??
      process.env.SEED_CLERK_USER_ID;
    if (clerkUserId) params.clerkUserId = clerkUserId;
    if (flags.force) params.force = true;
    if (typeof flags.months === "string") params.months = Number(flags.months);
  }
  if (typeof flags.folder === "string") params.folder = flags.folder;

  const response = await fetch(`${baseUrl}/api/admin`, {
    method: "POST",
    headers,
    body: JSON.stringify({ command, ...params }),
  });
  return report(response);
}

async function report(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload as { error?: string; message?: string } | null;
    console.error(
      `${response.status} ${error?.error ?? "requestFailed"}${error?.message ? ` — ${error.message}` : ""}`,
    );
    process.exit(1);
  }

  const body = payload as { command?: string; result?: unknown; commands?: { name: string; summary: string }[] };
  if (body.commands) {
    for (const c of body.commands) console.log(`  ${c.name.padEnd(16)} ${c.summary}`);
    return;
  }
  if (body.command === "seed-dev-user") {
    printSeedSummary(body.result as SeedSummary);
    return;
  }
  console.log(JSON.stringify(body.result, null, 2));
}

type SeedSummary = {
  profileId: string;
  months: number;
  inserted: number;
  totalCents: number;
  currency: string;
  byCategory: { name: string; count: number; totalCents: number }[];
  missingCategories: string[];
};

function printSeedSummary(summary: SeedSummary) {
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});