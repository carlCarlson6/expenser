"use client";

import { cx } from "@/shared/ui/cx";

/** Small colored dot identifying a category. */
export function CategoryDot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

/** Category pill used in expense lists. */
export function CategoryBadge({
  color,
  name,
}: {
  color: string;
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
      <CategoryDot color={color} />
      {name}
    </span>
  );
}

/** Color key for the trend chart, showing each category's period total. */
export function CategoryLegend({
  items,
  currency,
  locale,
}: {
  items: { name: string; color: string; totalCents: number }[];
  currency: string;
  locale: string;
}) {
  if (items.length === 0) return null;

  const fmt = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      cents / 100,
    );

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs">
      {items.map((c) => (
        <span key={c.name} className="inline-flex items-center gap-1.5">
          <CategoryDot color={c.color} />
          <span className="text-zinc-600">{c.name}</span>
          <span className="font-medium text-zinc-900">{fmt(c.totalCents)}</span>
        </span>
      ))}
    </div>
  );
}
