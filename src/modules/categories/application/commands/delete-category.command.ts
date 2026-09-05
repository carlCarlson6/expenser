import type { CategoryRepository } from "@/modules/categories/domain/category.repository";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { CategoryUsageChecker } from "../ports/category-usage-checker.port";

export interface DeleteCategoryInput {
  categoryId: string;
  userId: string;
}

export async function deleteCategory({
  input,
  repo,
  usageChecker,
}: {
  input: DeleteCategoryInput;
  repo: CategoryRepository;
  usageChecker: CategoryUsageChecker;
}): Promise<Result<void, string>> {
  const category = await repo.findById(input.categoryId);
  if (!category || category.userId !== input.userId) {
    return err("Category not found");
  }

  const inUse = await usageChecker.isCategoryInUse(input.categoryId);
  if (inUse) {
    return err("Cannot delete a category that is used by transactions");
  }

  await repo.delete(input.categoryId);
  return ok(undefined);
}
