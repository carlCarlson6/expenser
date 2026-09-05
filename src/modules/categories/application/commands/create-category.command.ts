import { Category } from "@/modules/categories/domain/category";
import type { CategoryRepository } from "@/modules/categories/domain/category.repository";
import { err, ok, type Result } from "@/shared/kernel/result";
import { toCategoryDto, type CategoryDto } from "../category.dto";
import type { CategoryIdGenerator } from "../ports/category-id-generator.port";

export interface CreateCategoryInput {
  userId: string;
  name: string;
  color: string;
  icon: string;
}

export interface CreateCategoryDeps {
  repo: CategoryRepository;
  idGenerator: CategoryIdGenerator;
}

export async function createCategory({
  input,
  deps,
}: {
  input: CreateCategoryInput;
  deps: CreateCategoryDeps;
}): Promise<Result<CategoryDto, string>> {
  const normalizedName = input.name.trim().toLowerCase();
  const existing = await deps.repo.findByUserIdAndName(
    input.userId,
    normalizedName,
  );
  if (existing) {
    return err("A category with this name already exists");
  }

  const categoryResult = Category.create({
    id: deps.idGenerator.generate(),
    userId: input.userId,
    name: input.name,
    color: input.color,
    icon: input.icon,
  });
  if (!categoryResult.ok) {
    return err(categoryResult.error);
  }

  await deps.repo.save(categoryResult.value);
  return ok(toCategoryDto(categoryResult.value));
}
