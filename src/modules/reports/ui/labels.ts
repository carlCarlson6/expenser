import { parseISODate, type Granularity } from "../domain/dates";

/** Human label for a bucket start date, per granularity and locale. */
export function bucketLabel(
  bucket: string,
  granularity: Granularity,
  locale: string,
): string {
  const d = parseISODate(bucket);
  if (granularity === "month") {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "2-digit",
    }).format(d);
  }
  if (granularity === "week") {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(d);
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}
