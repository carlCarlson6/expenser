/** Pure transformation of the raw bucket×category rows into the bounded
 *  matrix the stacked chart renders. Lives in the domain because the cap is a
 *  data decision (how much reaches the client), not a styling one. */
import type { PeriodCategorySum } from "../data/repository";

/** Sentinel category holding the tail beyond the cap. It carries no real
 *  name — the UI substitutes a localized label. */
export const OTHER_CATEGORY_ID = "__other__";

/** Cap on stacked series, so the payload and the rendered bar count stay
 *  bounded no matter how many categories the profile has. */
export const MAX_STACKED_CATEGORIES = 7;

export type StackedCategory = {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
};

export type StackedBucket = {
  bucket: string;
  byCategory: Record<string, number>;
};

export type StackedData = {
  /** Ordered by total, largest first; OTHER_CATEGORY_ID is always last. */
  categories: StackedCategory[];
  buckets: StackedBucket[];
};

/**
 * Rolls `rows` up into a dense matrix: one entry per bucket, keyed by
 * category. Categories beyond {@link MAX_STACKED_CATEGORIES} are folded into
 * {@link OTHER_CATEGORY_ID}. `bucketKeys` fixes the row order and fills
 * buckets the query returned no rows for.
 */
export function buildStacked(
  rows: PeriodCategorySum[],
  bucketKeys: string[],
): StackedData {
  const totals = new Map<string, StackedCategory>();

  for (const row of rows) {
    const existing = totals.get(row.categoryId);
    if (existing) existing.totalCents += row.totalCents;
    else
      totals.set(row.categoryId, {
        categoryId: row.categoryId,
        name: row.name,
        color: row.color,
        totalCents: row.totalCents,
      });
  }

  // Largest first; ties fall back to the name so the order is deterministic
  // and the chart does not reshuffle between renders.
  const ranked = [...totals.values()].sort(
    (a, b) =>
      b.totalCents - a.totalCents || a.name.localeCompare(b.name),
  );

  const kept = ranked.slice(0, MAX_STACKED_CATEGORIES);
  const dropped = ranked.slice(MAX_STACKED_CATEGORIES);
  const otherTotal = dropped.reduce((sum, c) => sum + c.totalCents, 0);
  const categories = dropped.length
    ? [
        ...kept,
        {
          categoryId: OTHER_CATEGORY_ID,
          name: "",
          color: "#a1a1aa",
          totalCents: otherTotal,
        },
      ]
    : kept;

  // Buckets where a category spent nothing get an explicit 0: Recharts reads
  // a missing key as a gap, which would punch holes in a stacked bar.
  const zeroRow = () =>
    Object.fromEntries(categories.map((c) => [c.categoryId, 0]));

  const keptIds = new Set(kept.map((c) => c.categoryId));
  const byBucket = new Map<string, Record<string, number>>();
  for (const key of bucketKeys) byBucket.set(key, zeroRow());
  for (const row of rows) {
    const bucket = byBucket.get(row.bucket);
    if (!bucket) continue;
    const id = keptIds.has(row.categoryId) ? row.categoryId : OTHER_CATEGORY_ID;
    bucket[id] = (bucket[id] ?? 0) + row.totalCents;
  }

  return {
    categories,
    buckets: bucketKeys.map((bucket) => ({
      bucket,
      byCategory: byBucket.get(bucket)!,
    })),
  };
}
