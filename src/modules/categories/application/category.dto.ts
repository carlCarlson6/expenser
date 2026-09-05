import type { Category } from "@/modules/categories/domain/category";

export interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
}

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    icon: category.icon,
  };
}
