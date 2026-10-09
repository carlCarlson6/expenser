import { currencyFormatter } from "./format";

/** Intensity steps for the heat scale. Deliberately few: a continuous ramp
 *  turns most cells indistinguishable at a glance. */
const LEVELS = [
  "bg-zinc-100",
  "bg-emerald-200",
  "bg-emerald-300",
  "bg-emerald-400",
  "bg-emerald-600",
];

/** Weekday initials, Monday first — the grid rows run Mon→Sun. */
export type HeatmapLabels = {
  /** Short weekday names, Monday first: one per grid row. */
  weekdays: readonly string[];
  less: string;
  more: string;
};

type DayCell = { date: string; totalCents: number };

/**
 * Calendar heatmap of daily spend: one cell per day, one column per week,
 * intensity by that day's total. Not a Recharts chart — a CSS grid renders it
 * cheaper, ships no JS, and lets each cell carry a native tooltip.
 */
export function CalendarHeatmap({
  days,
  currency,
  locale,
  labels,
}: {
  /** Every day of the period, in order, gaps already filled with zeroes. */
  days: DayCell[];
  currency: string;
  locale: string;
  labels: HeatmapLabels;
}) {
  if (days.length === 0) return null;

  const fmt = currencyFormatter(currency, locale);
  const totals = days.map((d) => d.totalCents);
  const max = Math.max(...totals);

  // Pad the first column so the period starts on its true weekday row.
  const leadingBlanks = weekdayIndex(days[0].date);
  const cells: (DayCell | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];

  return (
    <div className="w-full">
      <div className="flex gap-1">
        {/* Weekday gutter, aligned to the 7-row grid. */}
        <div className="flex shrink-0 flex-col gap-1 pr-1 text-[10px] leading-3 text-zinc-400">
          {labels.weekdays.map((l, i) => (
            <span key={i} className="h-3 w-3 leading-3">
              {l}
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
          {cells.map((day, i) => (
            <div
              key={day?.date ?? `pad-${i}`}
              title={
                day ? `${day.date} · ${fmt(day.totalCents)}` : undefined
              }
              className={`h-3 w-3 rounded-[3px] ${
                day ? LEVELS[intensity(day.totalCents, max)] : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-zinc-400">
        <span>{labels.less}</span>
        {LEVELS.map((level) => (
          <span key={level} className={`h-3 w-3 rounded-[3px] ${level}`} />
        ))}
        <span>{labels.more}</span>
      </div>
    </div>
  );
}

/** Monday-based weekday index, matching the grid's row order. */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/**
 * Maps a total onto a step. Bucketing on a fraction of the max rather than an
 * absolute amount keeps a quiet week from rendering as an empty calendar.
 */
function intensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const step = Math.ceil((value / max) * LEVELS.length);
  return Math.min(Math.max(step - 1, 0), LEVELS.length - 1);
}
