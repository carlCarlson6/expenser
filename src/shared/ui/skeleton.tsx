import { cx } from "./cx";

/** Decorative placeholder block used inside loading.tsx fallbacks. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("animate-pulse rounded-lg bg-zinc-200/70", className)}
    />
  );
}
