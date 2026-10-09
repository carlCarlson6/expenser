import type { Actor } from "@/modules/users/domain/types";

import type {
  CategoryRepository,
  CategoryWithTotals,
} from "../../data/repository";
import type { Category } from "../../data/schema";

type Repos = { categories: CategoryRepository };

export async function listCategories(
  repos: Repos,
  actor: Actor,
): Promise<Category[]> {
  return repos.categories.listByProfile(actor.profileId);
}

export async function listCategoriesWithTotals(
  repos: Repos,
  actor: Actor,
): Promise<CategoryWithTotals[]> {
  return repos.categories.listWithTotals(actor.profileId);
}
