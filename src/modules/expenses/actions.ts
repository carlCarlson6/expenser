"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { fail, ok, type ActionResult } from "@/shared/result";

import { getActor } from "../users/actor";
import { DomainError } from "../users/domain/types";
import { createExpense } from "./domain/commands/create-expense";
import { deleteExpense } from "./domain/commands/delete-expense";
import { updateExpense } from "./domain/commands/update-expense";
import { expenseInputSchema } from "./domain/validators/expense";

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
    revalidatePath("/", "layout");
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
    revalidatePath("/", "layout");
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
    revalidatePath("/", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}
