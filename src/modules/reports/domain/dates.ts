/** Pure date helpers for bucketing expenses into time periods. */

export type Granularity = "day" | "week" | "month";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  // Monday-based weeks.
  const shift = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - shift);
  return copy;
}

/** First day of the bucket containing `iso`. */
export function bucketStart(iso: string, granularity: Granularity): Date {
  const d = parseISODate(iso);
  if (granularity === "month") return new Date(d.getFullYear(), d.getMonth(), 1);
  if (granularity === "week") return startOfWeek(d);
  return d;
}

export function nextBucket(d: Date, granularity: Granularity): Date {
  const copy = new Date(d);
  if (granularity === "month") copy.setMonth(copy.getMonth() + 1);
  else if (granularity === "week") copy.setDate(copy.getDate() + 7);
  else copy.setDate(copy.getDate() + 1);
  return copy;
}

/** Every bucket key ('YYYY-MM-DD' of the bucket start) covering [from, to]. */
export function bucketsBetween(
  from: string,
  to: string,
  granularity: Granularity,
): string[] {
  const keys: string[] = [];
  let cursor = bucketStart(from, granularity);
  const end = parseISODate(to);
  let guard = 0;
  while (cursor <= end && guard++ < 5000) {
    keys.push(toISODate(cursor));
    cursor = nextBucket(cursor, granularity);
  }
  return keys;
}

/** Inclusive last day of a window that ends exclusively at `toExclusive`. */
export function dayBefore(iso: string): string {
  return toISODate(addDays(parseISODate(iso), -1));
}

/**
 * The window of equal length ending the instant the current one starts.
 * `to` is the last (inclusive) day, so it lines up with the `bucketsBetween`
 * convention; `toExclusive` is the half-open bound the repositories take.
 */
export function previousRange(
  from: string,
  toExclusive: string,
): { from: string; toExclusive: string; toInclusive: string } {
  const days =
    Math.round(
      (parseISODate(toExclusive).getTime() - parseISODate(from).getTime()) /
        86_400_000,
    ) || 1;
  const prevFrom = toISODate(addDays(parseISODate(from), -days));
  return { from: prevFrom, toExclusive: from, toInclusive: dayBefore(from) };
}

/** [from, toExclusive) for the calendar month containing `today`. */
export function monthRange(today: Date): { from: string; toExclusive: string } {
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return { from: toISODate(first), toExclusive: toISODate(next) };
}

export function addMonths(d: Date, months: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
