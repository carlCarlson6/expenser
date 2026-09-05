/**
 * Driven port that answers whether a category is currently referenced by
 * transactions. Implemented by the ledger context once that slice exists;
 * until then the composition root supplies a stub that reports "not in use".
 */
export interface CategoryUsageChecker {
  isCategoryInUse(categoryId: string): Promise<boolean>;
}
