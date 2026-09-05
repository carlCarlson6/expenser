import { Category } from "@/modules/categories/domain/category";
import type { CategoryRepository } from "@/modules/categories/domain/category.repository";

export class TestCategoryRepository implements CategoryRepository {
  private categories = new Map<string, Category>();

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Category | null> {
    const trimmed = name.trim().toLowerCase();
    return (
      Array.from(this.categories.values()).find(
        (c) =>
          c.userId === userId && c.name.trim().toLowerCase() === trimmed,
      ) ?? null
    );
  }

  async save(category: Category): Promise<void> {
    this.categories.set(category.id, category);
  }

  async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }
}
