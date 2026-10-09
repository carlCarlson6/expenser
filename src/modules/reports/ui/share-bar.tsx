import { ALL_CATEGORIES_COLOR } from "./colors";

/** CSS-only share bar, tinted with the category color. */
export function ShareBar({
  share,
  color = ALL_CATEGORIES_COLOR,
}: {
  share: number;
  color?: string;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${Math.max(2, Math.round(share * 100))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
