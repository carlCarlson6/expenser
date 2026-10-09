/**
 * Category color palette. Defaults are seeded in this order so a fresh
 * profile gets visually distinct categories without editing anything.
 */
export const CATEGORY_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate (reserved for "Other"-style buckets)
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

/** Picks the palette entry furthest from the colors already in use, so
 *  newly created categories stay visually distinct. */
export function nextColor(used: string[]): string {
  const usedSet = new Set(used.map((c) => c.toLowerCase()));
  const free = CATEGORY_PALETTE.filter((c) => !usedSet.has(c));
  return free[0] ?? CATEGORY_PALETTE[0];
}
