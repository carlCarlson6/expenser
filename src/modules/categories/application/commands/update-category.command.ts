import type { CategoryRepository } from "@/modules/categories/domain/category.repository";
import { err, ok, type Result } from "@/shared/kernel/result";
import { toCategoryDto, type CategoryDto } from "../category.dto";

export interface UpdateCategoryInput {
  categoryId: string;
  userId: string;
  name?: string;
  color?: string;
  icon?: string;
}

export async function updateCategory({
  input,
  repo,
}: {
  input: UpdateCategoryInput;
  repo: CategoryRepository;
}): Promise<Result<CategoryDto, string>> {
  const category = await repo.findById(input.categoryId);
  if (!category || category.userId !== input.userId) {
    return err("Category not found");
  }

  if (input.name !== undefined) {
    const renameResult = category.rename(input.name);
    if (!renameResult.ok) {
      return err(renameResult.error);
    }
  }

  if (input.color !== undefined || input.icon !== undefined) {
    const color = input.color ?? category.color;
    const icon = input.icon ?? category.icon;
    const appearanceResult = category.changeAppearance(color, icon);
    if (!appearanceResult.ok) {
      return err(appearanceResult.error);
    }
  }

  await repo.save(category);
  return ok(toCategoryDto(category));
}
