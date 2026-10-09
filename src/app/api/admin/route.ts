import { z } from "zod";

import {
  findAdminCommand,
  listAdminCommands,
} from "@/modules/admin/commands";
import { DomainError } from "@/modules/users/domain/types";
import { requireAdminKey } from "@/shared/auth/admin";
import { getDb } from "@/shared/db/client";

// postgres-js and the migrations folder need the Node runtime.
export const runtime = "nodejs";

/**
 * Admin endpoint. One route, many commands:
 *
 *   POST /api/admin   { "command": "migrate" }
 *   POST /api/admin   { "command": "seed-dev-user", "clerkUserId": "user_x" }
 *   GET  /api/admin   -> the available commands
 *
 * Authenticated with the `x-admin-key` header (see `shared/auth/admin`), not
 * with Clerk — `src/proxy.ts` leaves `/api/*` out of the locale/auth chain.
 */
export async function POST(request: Request) {
  const auth = requireAdminKey(request);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalidJson" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ ok: false, error: "invalidBody" }, { status: 400 });
  }

  const { command, ...params } = body as Record<string, unknown>;
  if (typeof command !== "string" || command === "") {
    return Response.json(
      { ok: false, error: "missingCommand", commands: listAdminCommands() },
      { status: 400 },
    );
  }

  const handler = findAdminCommand(command);
  if (!handler) {
    return Response.json(
      { ok: false, error: "unknownCommand", commands: listAdminCommands() },
      { status: 404 },
    );
  }

  const parsed = handler.params.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "invalidParams",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await handler.run(parsed.data, { db: getDb() });
    return Response.json({ ok: true, command, result });
  } catch (error) {
    if (error instanceof DomainError) {
      const status = error.code === "alreadySeeded" ? 409 : 400;
      return Response.json({ ok: false, command, error: error.code }, { status });
    }
    console.error(`[admin] ${command} failed`, error);
    return Response.json(
      {
        ok: false,
        command,
        error: "commandFailed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = requireAdminKey(request);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  return Response.json({ ok: true, commands: listAdminCommands() });
}