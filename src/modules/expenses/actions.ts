"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/shared/db/client";
import { createRepos, runInTransaction } from "@/shared/db/repos";
import { fail, ok, type ActionResult } from "@/shared/result";

import { getActor } from "../users/actor";
import { DomainError } from "../users/domain/types";
import { createExpense } from "./domain/commands/create-expense";
import { createExpensesBulk } from "./domain/commands/create-expenses-bulk";
import { deleteExpense } from "./domain/commands/delete-expense";
import { importExpenses } from "./domain/commands/import-expenses";
import { updateExpense } from "./domain/commands/update-expense";
import { listDuplicateFingerprints } from "./domain/queries/list-duplicate-fingerprints";
import {
  bulkExpensesSchema,
  expenseInputSchema,
  MAX_BULK_ROWS,
  toBulkFieldErrors,
} from "./domain/validators/expense";
import {
  duplicateRangeSchema,
  importPayloadSchema,
} from "./domain/validators/import";

function toResult(error: unknown): ActionResult {
  if (error instanceof DomainError) return fail(error.code);
  throw error;
}

function parseExpenseForm(formData: FormData) {
  return expenseInputSchema.safeParse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? undefined,
    spentAt: formData.get("spentAt"),
  });
}

export async function createExpenseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) {
    return fail("generic", z.flattenError(parsed.error).fieldErrors);
  }
  try {
    const actor = await getActor();
    await createExpense(createRepos(getDb()), actor, parsed.data);
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

const BULK_ROW_FIELD = /^rows\[(\d+)\]\.(amount|categoryId|description|spentAt)$/;

/**
 * Rebuilds the `rows[i].field` entries a bulk form posts back into an ordered
 * array of raw rows. Index order is the only ordering the form relies on.
 */
function parseBulkExpenseForm(formData: FormData) {
  const rows = new Map<number, Record<string, FormDataEntryValue | undefined>>();
  for (const [key, value] of formData.entries()) {
    const match = BULK_ROW_FIELD.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const row = rows.get(index) ?? {};
    row[match[2]] = value;
    rows.set(index, row);
  }
  return [...rows.keys()]
    .sort((a, b) => a - b)
    .map((index) => rows.get(index)!);
}

export async function createExpensesBulkAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Row-count problems are reported at the top level so the form shows one
  // message instead of an error against a row that is not itself wrong.
  const rawRows = parseBulkExpenseForm(formData);
  if (rawRows.length === 0) return fail("bulkEmpty");
  if (rawRows.length > MAX_BULK_ROWS) return fail("tooManyRows");

  const parsed = bulkExpensesSchema.safeParse({ rows: rawRows });
  if (!parsed.success) {
    return fail("generic", toBulkFieldErrors(parsed.error));
  }

  try {
    const actor = await getActor();
    await createExpensesBulk(createRepos(getDb()), actor, parsed.data.rows);
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

export async function updateExpenseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  const parsed = parseExpenseForm(formData);
  if (typeof id !== "string" || !parsed.success) {
    return fail(
      "generic",
      parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    );
  }
  try {
    const actor = await getActor();
    await updateExpense(createRepos(getDb()), actor, { id, ...parsed.data });
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

export async function deleteExpenseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string") return fail("generic");
  try {
    const actor = await getActor();
    await deleteExpense(createRepos(getDb()), actor, { id });
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Imports a previewed batch in one atomic submission. The client parses and
 * validates the file (see `domain/import`), so validation failures here mean
 * the payload did not come from the preview form; row-scoped messages still
 * map back to the same `rows.<index>.<field>` keys the bulk form uses.
 */
export async function importExpensesAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = formData.get("payload");
  let json: unknown = null;
  if (typeof raw === "string") {
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }
  }

  const parsed = importPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return fail("generic", toBulkFieldErrors(parsed.error));
  }

  try {
    const actor = await getActor();
    await importExpenses(
      createRepos(getDb()),
      actor,
      parsed.data.rows,
      (fn) => runInTransaction(getDb(), fn),
    );
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

/**
 * Fingerprints of existing expenses in a date range, used by the import
 * preview to flag possible duplicates. Read-only; failures degrade to "no
 * duplicates" rather than blocking the import.
 */
export async function checkImportDuplicatesAction(
  input: unknown,
): Promise<string[]> {
  const parsed = duplicateRangeSchema.safeParse(input);
  if (!parsed.success) return [];
  try {
    const actor = await getActor();
    return await listDuplicateFingerprints(
      createRepos(getDb()),
      actor,
      parsed.data,
    );
  } catch {
    return [];
  }
}
