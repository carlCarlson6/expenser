import type { Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "../../data/repository";
import { importFingerprint } from "../import/values";

type Repos = { expenses: ExpenseRepository };

/**
 * Fingerprints of the profile's expenses inside a date range, so the import
 * preview can flag rows that probably already exist. Compared on day, cents
 * and normalized description only — it is a hint, not a uniqueness claim.
 */
export async function listDuplicateFingerprints(
  repos: Repos,
  actor: Actor,
  range: { from: string; to: string },
): Promise<string[]> {
  const rows = await repos.expenses.listFingerprints(
    actor.profileId,
    range.from,
    range.to,
  );
  return rows.map((row) => importFingerprint(row));
}
