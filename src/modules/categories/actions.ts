"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, type Db } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { fail, ok, type ActionResult } from "@/shared/result";

import { getActor } from "../users/actor";
import { DomainError } from "../users/domain/types";
import { createCategory } from "./domain/commands/create-category";
import { deleteCategory } from "./domain/commands/delete-category";
import { renameCategory } from "./domain/commands/rename-category";
import { setCategoryColor } from "./domain/commands/set-category-color";
import { categoryNameSchema } from "./domain/validators/category";

function toResult(error: unknown): ActionResult {
  if (error instanceof DomainError) return fail(error.code);
  throw error;
}

export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categoryNameSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return fail("generic", z.flattenError(parsed.error).fieldErrors);
  }
  try {
    const actor = await getActor();
    await createCategory(createRepos(getDb()), actor, parsed.data);
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

export async function renameCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  const parsed = categoryNameSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? undefined,
  });
  if (typeof id !== "string" || !parsed.success) {
    return fail(
      "generic",
      parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    );
  }
  try {
    const actor = await getActor();
    await renameCategory(createRepos(getDb()), actor, {
      id,
      name: parsed.data.name,
      color: parsed.data.color,
    });
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

export async function setCategoryColorAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  const parsed = categoryNameSchema.safeParse({
    name: "color-only",
    color: formData.get("color"),
  });
  if (typeof id !== "string" || !parsed.success) {
    return fail("generic");
  }
  try {
    const actor = await getActor();
    await setCategoryColor(createRepos(getDb()), actor, {
      id,
      color: parsed.data.color!,
    });
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}

export async function deleteCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string") return fail("generic");
  try {
    const actor = await getActor();
    // Reassign + delete must be atomic.
    await getDb().transaction(async (tx) => {
      await deleteCategory(createRepos(tx as unknown as Db), actor, { id });
    });
    revalidatePath("/[locale]", "layout");
    return ok;
  } catch (error) {
    return toResult(error);
  }
}
