"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cx } from "@/shared/ui/cx";
import { Button } from "@/shared/ui/button";
import { Label, Select } from "@/shared/ui/field";

import {
  DEFAULT_PRESET,
  presetGranularity,
  type Preset,
  type RangePreset,
} from "@/modules/reports/domain/period";

import { CHART_TYPES, DEFAULT_CHART, type ChartType } from "./chart";
import { ChartIcon } from "./chart-icons";

const PRESET_KEYS = {
  "30d": "last30Days",
  "6m": "last6Months",
  "12m": "last12Months",
  month: "thisMonth",
  custom: "customRange",
} as const;

/** Clickable presets, in the order they are offered. */
const PRESET_BUTTONS: RangePreset[] = ["month", "30d", "6m", "12m"];

const CHART_KEYS = {
  bar: "barChart",
  line: "lineChart",
  area: "areaChart",
  cumulative: "cumulativeChart",
  stacked: "stackedChart",
  donut: "donutChart",
  heatmap: "heatmapChart",
} as const;

export function DashboardFilters({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial: {
    preset: Preset;
    from: string;
    to: string;
    granularity: string;
    categoryId: string;
    chart: ChartType;
  };
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState(initial);

  const push = (next: typeof values) => {
    setValues(next);
    const qs = new URLSearchParams();
    if (next.preset !== "custom") qs.set("preset", next.preset);
    else {
      if (next.from) qs.set("from", next.from);
      if (next.to) qs.set("to", next.to);
    }
    // The period's own bucket size stays out of the URL, like the default.
    if (next.granularity !== presetGranularity(next.preset)) {
      qs.set("granularity", next.granularity);
    }
    if (next.categoryId) qs.set("categoryId", next.categoryId);
    if (next.chart !== DEFAULT_CHART) qs.set("chart", next.chart);
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  // A preset owns the range: the From/To fields stay empty until the user
  // picks dates themselves (which turns the preset into "custom"). It also
  // owns the bucket size, so the chart never collapses to a single bar.
  const pickPreset = (preset: RangePreset) =>
    push({
      ...values,
      preset,
      from: "",
      to: "",
      granularity: presetGranularity(preset),
    });

  // Grouping and category narrow the same period, so they keep the preset:
  // marking it custom would drop it from the URL and silently fall back to
  // the default window while the buttons still showed the old one.
  const set = (patch: Partial<typeof values>) => push({ ...values, ...patch });

  // Picking dates ourselves is the only way out of a preset range.
  const setDates = (patch: Pick<Partial<typeof values>, "from" | "to">) =>
    push({ ...values, ...patch, preset: "custom" as const });

  // The chart shape is presentation only: it must not disturb the period.
  const setChart = (chart: ChartType) => push({ ...values, chart });

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-zinc-500">
          {t("period")}
        </span>
        {PRESET_BUTTONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pickPreset(p)}
            className={cx(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              values.preset === p
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {t(PRESET_KEYS[p])}
          </button>
        ))}
        {values.preset === "custom" && (
          <span className="self-center text-sm text-zinc-500">
            {t(PRESET_KEYS.custom)}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-zinc-500">
          {t("chartType")}
        </span>
        {CHART_TYPES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChart(c)}
            aria-pressed={values.chart === c}
            aria-label={t(CHART_KEYS[c])}
            title={t(CHART_KEYS[c])}
            className={cx(
              "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              values.chart === c
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            <ChartIcon type={c} className="h-4 w-4" />
            {t(CHART_KEYS[c])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="d-from">{t("from")}</Label>
          <input
            id="d-from"
            type="date"
            value={values.from}
            onChange={(e) => setDates({ from: e.target.value })}
            className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="d-to">{t("to")}</Label>
          <input
            id="d-to"
            type="date"
            value={values.to}
            onChange={(e) => setDates({ to: e.target.value })}
            className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <Label htmlFor="d-granularity">{t("granularity")}</Label>
          <Select
            id="d-granularity"
            value={values.granularity}
            onChange={(e) => set({ granularity: e.target.value })}
          >
            <option value="day">{t("day")}</option>
            <option value="week">{t("week")}</option>
            <option value="month">{t("month")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="d-category">{t("category")}</Label>
          <Select
            id="d-category"
            value={values.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
          >
            <option value="">{t("allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {values.preset === "custom" && (
        <div className="mt-3 text-right">
          <Button variant="ghost" onClick={() => pickPreset(DEFAULT_PRESET)}>
            {t("reset")}
          </Button>
        </div>
      )}
    </div>
  );
}
