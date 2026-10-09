"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { fail, ok, type ActionResult } from "@/shared/result";

import { getActor } from "./actor";
import { updateSettings } from "./domain/commands/update-settings";
import { DomainError } from "./domain/types";
import { settingsSchema } from "./domain/validators/settings";

export async function updateSettingsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse({
    locale: formData.get("locale"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return fail("generic", z.flattenError(parsed.error).fieldErrors);
  }
  try {
    const actor = await getActor();
    await updateSettings(createRepos(getDb()), actor, parsed.data);
    revalidatePath("/", "layout");
    return ok;
  } catch (error) {
    if (error instanceof DomainError) return fail(error.code);
    throw error;
  }
}
