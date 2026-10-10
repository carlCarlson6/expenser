import { nextColor } from "@/modules/categories/data/palette";
import type { CategoryRepository } from "@/modules/categories/data/repository";
import { normalizeCategoryName } from "@/modules/categories/domain/normalize-name";
import { DomainError, type Actor } from "@/modules/users/domain/types";

import type { ExpenseRepository } from "../../data/repository";
import { IMPORT_INSERT_BATCH } from "../validators/import";
import type { TransactionRunner } from "./create-expenses-bulk";

type Repos = {
  expenses: ExpenseRepository;
  categories: CategoryRepository;
};

export type ImportExpenseRow = {
  spentAt: string;
  amountCents: number;
  /** Display name as typed in the file; null/empty uses the protected bucket. */
  categoryName?: string | null;
  description?: string | null;
};

export type ImportExpensesSummary = {
  imported: number;
  categoriesCreated: number;
};

/**
 * Imports expenses in one unit of work: category names are matched against
 * the profile's existing categories ignoring case, accents and surrounding
 * whitespace, and every name that has no match becomes a new category with
 * the next free palette color. Names that only differ by spelling collapse
 * into the first one seen.
 *
 * The whole import runs inside the caller-supplied runner, so a failure
 * anywhere — including a mid-flight category deletion — rolls back inserted
 * expenses and newly created categories together.
 */
export async function importExpenses(
  repos: Repos,
  actor: Actor,
  rows: ImportExpenseRow[],
  run: TransactionRunner = (fn) => fn(repos),
): Promise<ImportExpensesSummary> {
  if (rows.length === 0) throw new DomainError("bulkEmpty");

  return run(async (tx) => {
    const existing = await tx.categories.listByProfile(actor.profileId);
    const categoryIdByKey = new Map<string, string>(
      existing.map((category) => [
        normalizeCategoryName(category.name),
        category.id,
      ]),
    );
    const protectedCategory = existing.find((c) => c.isProtected) ?? null;
    if (rows.some((row) => !row.categoryName?.trim()) && !protectedCategory) {
      throw new DomainError("notFound");
    }

    // Distinct unmatched names in first-seen order. File spellings that
    // normalize to the same key share one new category.
    const missing = new Map<string, string>();
    for (const row of rows) {
      const name = row.categoryName?.trim();
      if (!name) continue;
      const key = normalizeCategoryName(name);
      if (!categoryIdByKey.has(key) && !missing.has(key)) {
        missing.set(key, name);
      }
    }

    let categoriesCreated = 0;
    const usedColors = existing.map((category) => category.color);
    for (const [key, name] of missing) {
      const color = nextColor(usedColors);
      usedColors.push(color);
      const created = await tx.categories.create(actor.profileId, name, color);
      categoryIdByKey.set(key, created.id);
      categoriesCreated++;
    }

    const inputs = rows.map((row) => {
      const name = row.categoryName?.trim();
      return {
        categoryId: name
          ? categoryIdByKey.get(normalizeCategoryName(name))!
          : protectedCategory!.id,
        amountCents: row.amountCents,
        description: row.description?.trim() || undefined,
        spentAt: row.spentAt,
      };
    });

    let imported = 0;
    for (let i = 0; i < inputs.length; i += IMPORT_INSERT_BATCH) {
      imported += await tx.expenses.insertMany(
        actor.profileId,
        inputs.slice(i, i + IMPORT_INSERT_BATCH),
      );
    }
    return { imported, categoriesCreated };
  });
}
