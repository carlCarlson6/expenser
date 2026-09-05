import type { CategoryDto } from "../category.dto";
import { createCategory, type CreateCategoryDeps } from "./create-category.command";
import { listCategories } from "../queries/list-categories.query";

export interface SeedDefaultCategoriesInput {
  userId: string;
}

export type SeedDefaultCategoriesDeps = CreateCategoryDeps;

export const DEFAULT_CATEGORIES: ReadonlyArray<{
  name: string;
  color: string;
  icon: string;
}> = [
  { name: "Food & Groceries", color: "#22c55e", icon: "utensils" },
  { name: "Transport", color: "#3b82f6", icon: "car" },
  { name: "Housing", color: "#f59e0b", icon: "home" },
  { name: "Utilities", color: "#eab308", icon: "zap" },
  { name: "Entertainment", color: "#a855f7", icon: "film" },
  { name: "Health", color: "#ef4444", icon: "heart" },
  { name: "Shopping", color: "#ec4899", icon: "shopping-cart" },
  { name: "Travel", color: "#06b6d4", icon: "plane" },
];

/**
 * Idempotently seeds a sensible set of default categories for a new user.
 * If the user already has any categories, the existing list is returned
 * unchanged.
 */
export async function seedDefaultCategories({
  input,
  deps,
}: {
  input: SeedDefaultCategoriesInput;
  deps: SeedDefaultCategoriesDeps;
}): Promise<CategoryDto[]> {
  const existing = await listCategories({ userId: input.userId, repo: deps.repo });
  if (existing.length > 0) {
    return existing;
  }

  const created: CategoryDto[] = [];
  for (const defaults of DEFAULT_CATEGORIES) {
    const result = await createCategory({
      input: { userId: input.userId, ...defaults },
      deps,
    });
    if (result.ok) {
      created.push(result.value);
    }
  }
  return created;
}
