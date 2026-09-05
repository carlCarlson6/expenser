import type { Category } from "./category";

/**
 * Driven port for persisting and retrieving Category aggregates.
 * Implemented in the infrastructure layer by the Drizzle adapter.
 */
export interface CategoryRepository {
  /** Find a single category by its id, or null if not found. */
  findById(id: string): Promise<Category | null>;

  /** List all categories owned by a user, ordered by name. */
  findByUserId(userId: string): Promise<Category[]>;

  /** Find a category by its (case-insensitive) name for a given user. */
  findByUserIdAndName(userId: string, name: string): Promise<Category | null>;

  /** Persist a category (insert or update). */
  save(category: Category): Promise<void>;

  /** Remove a category by id. */
  delete(id: string): Promise<void>;
}
