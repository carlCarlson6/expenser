import type { CategoryRepository } from "@/modules/categories/data/repository";
import { listCategories } from "@/modules/categories/domain/queries/list-categories";
import type { ExpenseRepository } from "@/modules/expenses/data/repository";
import { createExpense } from "@/modules/expenses/domain/commands/create-expense";
import type { ProfileRepository } from "@/modules/users/data/repository";
import { getProfile } from "@/modules/users/domain/queries/get-profile";
import { DomainError, type Actor } from "@/modules/users/domain/types";

import { buildSeedDrafts } from "../seed-rules";

type Repos = {
  profiles: ProfileRepository;
  categories: CategoryRepository;
  expenses: ExpenseRepository;
};

/** Binds the writes to one unit of work; the caller decides if it is a tx. */
export type TransactionRunner = <T>(
  fn: (repos: Repos) => Promise<T>,
) => Promise<T>;

export const DEFAULT_SEED_MONTHS = 6;

export type SeedDevUserInput = {
  clerkUserId: string;
  /** Seed even when the profile already has expenses. */
  force?: boolean;
  months?: number;
  /** Injectable for tests; defaults to "now". */
  today?: Date;
};

export type SeedCategoryTotal = {
  categoryId: string;
  name: string;
  count: number;
  totalCents: number;
};

export type SeedDevUserResult = {
  profileId: string;
  months: number;
  inserted: number;
  totalCents: number;
  currency: string;
  byCategory: SeedCategoryTotal[];
  missingCategories: string[];
};

/**
 * Fills a development profile with `months` of plausible expenses.
 *
 * Writes go through the real `createExpense` command so seeded data passes the
 * same rules as the app, and through the caller's transaction runner so a
 * partial seed can never be committed.
 */
export async function seedDevUser(
  repos: Repos,
  input: SeedDevUserInput,
  run: TransactionRunner = (fn) => fn(repos),
): Promise<SeedDevUserResult> {
  const months = input.months ?? DEFAULT_SEED_MONTHS;
  const profile = await getProfile(repos, input.clerkUserId);
  const actor: Actor = {
    profileId: profile.id,
    clerkUserId: input.clerkUserId,
    locale: profile.locale,
    currency: profile.currency,
  };

  const existing = await repos.expenses.countByProfile(profile.id);
  if (existing > 0 && !input.force) {
    throw new DomainError("alreadySeeded");
  }

  const categories = await listCategories(repos, actor);
  const { drafts, missingCategories } = buildSeedDrafts({
    byName: new Map(categories.map((c) => [c.name, c.id])),
    clerkUserId: input.clerkUserId,
    months,
    today: input.today ?? new Date(),
  });

  await run(async (tx) => {
    for (const draft of drafts) {
      await createExpense(tx, actor, {
        amount: draft.amountCents,
        categoryId: draft.categoryId,
        description: draft.description,
        spentAt: draft.spentAt,
      });
    }
  });

  const nameOf = new Map(categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, SeedCategoryTotal>();
  for (const draft of drafts) {
    const entry = totals.get(draft.categoryId) ?? {
      categoryId: draft.categoryId,
      name: nameOf.get(draft.categoryId) ?? draft.categoryId,
      count: 0,
      totalCents: 0,
    };
    entry.count += 1;
    entry.totalCents += draft.amountCents;
    totals.set(draft.categoryId, entry);
  }
  const byCategory = [...totals.values()].sort(
    (a, b) => b.totalCents - a.totalCents,
  );

  return {
    profileId: profile.id,
    months,
    inserted: drafts.length,
    totalCents: byCategory.reduce((acc, c) => acc + c.totalCents, 0),
    currency: profile.currency,
    byCategory,
    missingCategories,
  };
}