import type { Actor } from "@/modules/users/domain/types";

import type {
  ExpenseRepository,
  ExpenseWithCategory,
} from "../../data/repository";
import type { ExpenseFiltersInput } from "../validators/expense";

type Repos = { expenses: ExpenseRepository };

export const EXPENSES_PAGE_SIZE = 20;

export type ExpensePage = {
  items: ExpenseWithCategory[];
  totalCount: number;
  page: number;
  pageCount: number;
};

export async function listExpenses(
  repos: Repos,
  actor: Actor,
  filters: ExpenseFiltersInput,
): Promise<ExpensePage> {
  const { items, totalCount } = await repos.expenses.list(actor.profileId, {
    categoryId: filters.categoryId,
    from: filters.from,
    to: filters.to,
    search: filters.search,
    page: filters.page,
    pageSize: EXPENSES_PAGE_SIZE,
  });
  return {
    items,
    totalCount,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(totalCount / EXPENSES_PAGE_SIZE)),
  };
}
