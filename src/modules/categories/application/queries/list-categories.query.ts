import type { CategoryRepository } from "@/modules/categories/domain/category.repository";
import { toCategoryDto, type CategoryDto } from "../category.dto";

export interface ListCategoriesQuery {
  userId: string;
  repo: CategoryRepository;
}

export async function listCategories({
  userId,
  repo,
}: ListCategoriesQuery): Promise<CategoryDto[]> {
  const categories = await repo.findByUserId(userId);
  return categories.map(toCategoryDto);
}
