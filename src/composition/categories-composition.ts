import { db } from "@/db";
import { generateId } from "@/db/id";
import { createCategory } from "@/modules/categories/application/commands/create-category.command";
import { deleteCategory } from "@/modules/categories/application/commands/delete-category.command";
import { seedDefaultCategories } from "@/modules/categories/application/commands/seed-default-categories.command";
import { updateCategory } from "@/modules/categories/application/commands/update-category.command";
import { listCategories } from "@/modules/categories/application/queries/list-categories.query";
import type { CategoryIdGenerator } from "@/modules/categories/application/ports/category-id-generator.port";
import type { CategoryUsageChecker } from "@/modules/categories/application/ports/category-usage-checker.port";
import { DrizzleCategoryRepository } from "@/modules/categories/infrastructure/drizzle-category.repository";
import { ledger } from "./ledger-composition";

const categoryRepository = new DrizzleCategoryRepository(db);

const categoryIdGenerator: CategoryIdGenerator = {
  generate: () => generateId("cat"),
};

const categoryUsageChecker: CategoryUsageChecker = {
  isCategoryInUse: async (categoryId: string) => {
    const count = await ledger.countByCategoryId(categoryId);
    return count > 0;
  },
};

export const categories = {
  list: (userId: string) =>
    listCategories({ userId, repo: categoryRepository }),

  create: (input: {
    userId: string;
    name: string;
    color: string;
    icon: string;
  }) =>
    createCategory({
      input,
      deps: { repo: categoryRepository, idGenerator: categoryIdGenerator },
    }),

  update: (input: {
    categoryId: string;
    userId: string;
    name?: string;
    color?: string;
    icon?: string;
  }) => updateCategory({ input, repo: categoryRepository }),

  delete: (input: { categoryId: string; userId: string }) =>
    deleteCategory({
      input,
      repo: categoryRepository,
      usageChecker: categoryUsageChecker,
    }),

  seedDefaults: (userId: string) =>
    seedDefaultCategories({
      input: { userId },
      deps: { repo: categoryRepository, idGenerator: categoryIdGenerator },
    }),
};
