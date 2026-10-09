import type {
  CategoryRepository,
  CategoryWithTotals,
} from "@/modules/categories/data/repository";
import type { Category } from "@/modules/categories/data/schema";
import type {
  ExpenseInput,
  ExpenseRepository,
  ExpenseWithCategory,
} from "@/modules/expenses/data/repository";
import type { Expense } from "@/modules/expenses/data/schema";
import type { ProfileRepository } from "@/modules/users/data/repository";
import type { Profile } from "@/modules/users/data/schema";

/** In-memory repository implementations for domain-layer unit tests. */

let seq = 0;
const id = () => `fake-${++seq}`;

export function createFakeProfileRepository(initial: Profile[] = []) {
  const store = new Map(initial.map((p) => [p.id, p]));
  const repo: ProfileRepository = {
    async findByClerkUserId(clerkUserId) {
      return [...store.values()].find((p) => p.clerkUserId === clerkUserId) ?? null;
    },
    async create(input) {
      const profile: Profile = {
        id: id(),
        clerkUserId: input.clerkUserId,
        locale: input.locale,
        currency: input.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(profile.id, profile);
      return profile;
    },
    async updateSettings(profileId, input) {
      const profile = store.get(profileId);
      if (!profile) throw new Error("Profile not found");
      const updated = { ...profile, ...input, updatedAt: new Date() };
      store.set(profileId, updated);
      return updated;
    },
  };
  return { repo, store };
}

export function createFakeCategoryRepository(initial: Category[] = []) {
  const store = new Map(initial.map((c) => [c.id, c]));
  const repo: CategoryRepository = {
    async listByProfile(profileId) {
      return [...store.values()]
        .filter((c) => c.profileId === profileId)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async listWithTotals(profileId) {
      const list = await repo.listByProfile(profileId);
      return list.map(
        (c): CategoryWithTotals => ({ ...c, expenseCount: 0, totalCents: 0 }),
      );
    },
    async findById(profileId, categoryId) {
      const c = store.get(categoryId);
      return c && c.profileId === profileId ? c : null;
    },
    async findProtected(profileId) {
      return (
        [...store.values()].find(
          (c) => c.profileId === profileId && c.isProtected,
        ) ?? null
      );
    },
    async findByName(profileId, name) {
      return (
        [...store.values()].find(
          (c) =>
            c.profileId === profileId &&
            c.name.toLowerCase() === name.toLowerCase(),
        ) ?? null
      );
    },
    async create(profileId, name) {
      const category: Category = {
        id: id(),
        profileId,
        name,
        isProtected: false,
        createdAt: new Date(),
      };
      store.set(category.id, category);
      return category;
    },
    async createMany(profileId, names, protectedIndex) {
      names.forEach((name, i) => {
        const category: Category = {
          id: id(),
          profileId,
          name,
          isProtected: i === protectedIndex,
          createdAt: new Date(),
        };
        store.set(category.id, category);
      });
    },
    async rename(profileId, categoryId, name) {
      const c = await repo.findById(profileId, categoryId);
      if (!c) return null;
      const updated = { ...c, name };
      store.set(categoryId, updated);
      return updated;
    },
    async remove(profileId, categoryId) {
      const c = await repo.findById(profileId, categoryId);
      if (c) store.delete(categoryId);
    },
  };
  return { repo, store };
}

export function createFakeExpenseRepository(initial: Expense[] = []) {
  const store = new Map(initial.map((e) => [e.id, e]));
  const repo: ExpenseRepository = {
    async findById(profileId, expenseId) {
      const e = store.get(expenseId);
      return e && e.profileId === profileId ? e : null;
    },
    async insert(profileId, input: ExpenseInput) {
      const expense: Expense = {
        id: id(),
        profileId,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        description: input.description ?? null,
        spentAt: input.spentAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(expense.id, expense);
      return expense;
    },
    async update(profileId, expenseId, input: ExpenseInput) {
      const e = await repo.findById(profileId, expenseId);
      if (!e) return null;
      const updated: Expense = {
        ...e,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        description: input.description ?? null,
        spentAt: input.spentAt,
        updatedAt: new Date(),
      };
      store.set(expenseId, updated);
      return updated;
    },
    async remove(profileId, expenseId) {
      const e = await repo.findById(profileId, expenseId);
      if (e) store.delete(expenseId);
    },
    async reassignCategory(profileId, fromCategoryId, toCategoryId) {
      let moved = 0;
      for (const e of store.values()) {
        if (e.profileId === profileId && e.categoryId === fromCategoryId) {
          store.set(e.id, { ...e, categoryId: toCategoryId });
          moved++;
        }
      }
      return moved;
    },
    async list(profileId, filters) {
      const all = [...store.values()].filter(
        (e) => e.profileId === profileId,
      );
      const items: ExpenseWithCategory[] = all.map((e) => ({
        ...e,
        categoryName: "fake",
      }));
      void filters;
      return { items, totalCount: items.length };
    },
  };
  return { repo, store };
}

export function createFakeRepos({
  profiles = [],
  categories = [],
  expenses = [],
}: {
  profiles?: Profile[];
  categories?: Category[];
  expenses?: Expense[];
} = {}) {
  const profilesFake = createFakeProfileRepository(profiles);
  const categoriesFake = createFakeCategoryRepository(categories);
  const expensesFake = createFakeExpenseRepository(expenses);
  return {
    repos: {
      profiles: profilesFake.repo,
      categories: categoriesFake.repo,
      expenses: expensesFake.repo,
    },
    stores: {
      profiles: profilesFake.store,
      categories: categoriesFake.store,
      expenses: expensesFake.store,
    },
  };
}
