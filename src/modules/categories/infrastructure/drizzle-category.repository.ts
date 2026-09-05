import { eq, ilike, asc, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Category } from "@/modules/categories/domain/category";
import type { CategoryRepository } from "@/modules/categories/domain/category.repository";
import {
  categories,
  type CategoryRow,
} from "@/modules/categories/infrastructure/categories.schema";

function toDomain(row: CategoryRow): Category {
  return Category.reconstitute({
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    icon: row.icon,
  });
}

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));
    return rows.map(toDomain);
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          ilike(categories.name, name.trim()),
        ),
      )
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async save(category: Category): Promise<void> {
    await this.db
      .insert(categories)
      .values({
        id: category.id,
        userId: category.userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: category.name,
          color: category.color,
          icon: category.icon,
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
