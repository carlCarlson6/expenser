/** Period presets: the window the dashboard aggregates over, and the bucket
 *  size that reads well on it. Pure logic, shared by the query and the filters. */
import {
  addDays,
  addMonths,
  toISODate,
  type Granularity,
} from "./dates";

export const PRESETS = ["30d", "6m", "12m", "month", "custom"] as const;
export type Preset = (typeof PRESETS)[number];

/** A preset that owns a range: "custom" only exists as explicit dates. */
export type RangePreset = Exclude<Preset, "custom">;

/** Shown when the URL carries no period: the current calendar month. */
export const DEFAULT_PRESET: RangePreset = "month";

/** Bucket size per preset, chosen so no window collapses to a single bar. */
const GRANULARITY: Record<Preset, Granularity> = {
  "30d": "day",
  month: "day",
  "6m": "week",
  "12m": "month",
  custom: "day",
};

/** Narrows a raw `?preset=` search param to a known preset. */
export function parsePreset(value: string | string[] | undefined): Preset {
  const raw = typeof value === "string" ? value : undefined;
  // "custom" is never in the URL: it is expressed as explicit dates.
  return PRESETS.find((p) => p === raw && p !== "custom") ?? DEFAULT_PRESET;
}

export function presetRange(
  preset: Preset,
  today: Date,
): { from: string; to: string } {
  const to = toISODate(today);
  switch (preset) {
    case "30d":
      return { from: toISODate(addDays(today, -29)), to };
    case "12m":
      return { from: toISODate(addMonths(today, -12)), to };
    case "month":
      return { from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    case "custom":
    case "6m":
      return { from: toISODate(addMonths(today, -6)), to };
  }
}

/** How the period is grouped: follows the span the preset covers. */
export function presetGranularity(preset: Preset): Granularity {
  return GRANULARITY[preset];
}

/** Detects which preset a range corresponds to (for the UI's active state). */
export function detectPreset(
  from: string,
  to: string,
  today: Date,
): Preset {
  // The default is tested first: on some days two presets cover the exact
  // same range (e.g. the 30th, where 30 days starts on the 1st) and the
  // window the user is actually looking at must win.
  const candidates = [DEFAULT_PRESET, ...PRESETS] as Preset[];
  const found = candidates.find((p) => {
    if (p === "custom") return false;
    const range = presetRange(p, today);
    return range.from === from && range.to === to;
  });
  return found ?? "custom";
}
