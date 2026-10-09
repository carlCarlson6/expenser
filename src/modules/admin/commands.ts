/**
 * Registry of the commands the admin endpoint can run.
 *
 * Adding a command: write it under `domain/commands/`, give it a zod schema
 * for its params and register it in `commands` below. The route handler, the
 * CLI and the error mapping need no changes.
 */

import { z } from "zod";

import type { Db } from "@/shared/db/client";
import { createRepos, runInTransaction } from "@/shared/db/repos";

import { runMigrations } from "./domain/commands/run-migrations";
import { seedDevUser } from "./domain/commands/seed-dev-user";

export type AdminContext = {
  db: Db;
};

export type AdminCommand = {
  name: string;
  summary: string;
  params: z.ZodType;
  run: (params: unknown, ctx: AdminContext) => Promise<unknown>;
};

/** Keeps each command's params typed from its own schema. */
function defineCommand<S extends z.ZodType>(def: {
  name: string;
  summary: string;
  params: S;
  run: (params: z.output<S>, ctx: AdminContext) => Promise<unknown>;
}): AdminCommand {
  return {
    name: def.name,
    summary: def.summary,
    params: def.params,
    run: (params, ctx) => def.run(params as z.output<S>, ctx),
  };
}

const migrateCommand = defineCommand({
  name: "migrate",
  summary: "Applies pending Drizzle migrations from ./drizzle.",
  params: z.object({
    folder: z.string().trim().min(1).optional(),
  }),
  run: (params) => runMigrations({ folder: params.folder }),
});

const seedDevUserCommand = defineCommand({
  name: "seed-dev-user",
  summary:
    "Fills a dev profile with months of plausible expenses (idempotent per user).",
  params: z.object({
    clerkUserId: z.string().trim().min(1).optional(),
    force: z.boolean().optional(),
    months: z.number().int().min(1).max(36).optional(),
  }),
  run: async (params, ctx) => {
    const clerkUserId = params.clerkUserId ?? process.env.SEED_CLERK_USER_ID;
    if (!clerkUserId) {
      throw new Error("clerkUserId is required (in the body or SEED_CLERK_USER_ID)");
    }
    return seedDevUser(
      createRepos(ctx.db),
      { clerkUserId, force: params.force, months: params.months },
      (fn) => runInTransaction(ctx.db, fn),
    );
  },
});

const commands: AdminCommand[] = [migrateCommand, seedDevUserCommand];

export function findAdminCommand(name: string): AdminCommand | undefined {
  return commands.find((c) => c.name === name);
}

export function listAdminCommands(): { name: string; summary: string }[] {
  return commands.map(({ name, summary }) => ({ name, summary }));
}