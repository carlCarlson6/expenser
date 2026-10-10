"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendSeriesPoint, TrendVariant } from "./chart";
import { ALL_CATEGORIES_COLOR } from "./colors";
import { currencyFormatter } from "./format";

const MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };
/** Visible neutral gray for the previous-period baseline: present, never dominant. */
const COMPARISON_COLOR = "#71717a";
/** Dark ink for the trailing moving average: visible against any category color. */
const MOVING_AVERAGE_COLOR = "#18181b";

export function TrendChart({
  data,
  currency,
  locale,
  color = ALL_CATEGORIES_COLOR,
  variant = "bar",
}: {
  /** Prepared by `buildTrendSeries`: value, baseline and average per bucket.
   *  `value` is in major currency units (e.g. euros). */
  data: TrendSeriesPoint[];
  currency: string;
  locale: string;
  /** Stroke/fill tint: the category color when filtered to one, neutral
   *  otherwise. */
  color?: string;
  /** Chart shape over the same series; `cumulative` plots the running total. */
  variant?: TrendVariant;
}) {
  const fmt = currencyFormatter(currency, locale);
  const t = useTranslations("dashboard");

  // Bars highlight the hovered slice; lines highlight the whole column.
  const cursor =
    variant === "bar"
      ? { fill: "rgba(0,0,0,0.05)" }
      : { stroke: "#d4d4d8", strokeWidth: 1 };

  // Axes and tooltip do not depend on the shape: rendered once and shared.
  const chrome = (
    <>
      <CartesianGrid vertical={false} stroke="#f4f4f5" />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        fontSize={12}
        stroke="#71717a"
        minTickGap={16}
      />
      <YAxis
        tickFormatter={(v) => fmt(Number(v))}
        tickLine={false}
        axisLine={false}
        fontSize={12}
        width={72}
        stroke="#71717a"
      />
      <Tooltip
        // Order matters: tooltip rows follow the order they are declared.
        formatter={(value, name) => [fmt(Number(value)), seriesLabel(name, variant, t)]}
        cursor={cursor}
        contentStyle={{ fontSize: 12, borderRadius: 8 }}
      />
      <Legend
        verticalAlign="bottom"
        formatter={(value) => seriesLabel(value, variant, t)}
        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
      />
    </>
  );

  /** The previous-period baseline: the same series one window back. */
  const comparison = <Line
    dataKey="comparison"
    stroke={COMPARISON_COLOR}
    strokeWidth={2}
    strokeDasharray="4 4"
    dot={false}
    activeDot={{ r: 3 }}
    connectNulls={false}
  />;

  /** The trailing moving average. Drawn only where it reads: on bars it would
   *  sit on top of the columns it summarizes. */
  const average =
    variant === "bar" ? null : (
      <Line
        dataKey="average"
        stroke={MOVING_AVERAGE_COLOR}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 3 }}
        connectNulls={false}
      />
    );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={data} margin={MARGIN}>
            {chrome}
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              fill={color}
              fillOpacity={0.9}
            />
            {comparison}
          </BarChart>
        ) : variant === "area" ? (
          <AreaChart data={data} margin={MARGIN}>
            {chrome}
            {comparison}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.25}
            />
            {average}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={MARGIN}>
            {chrome}
            {comparison}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            {average}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Series keys are internal; the user reads what each line means. */
function seriesLabel(
  name: unknown,
  variant: TrendVariant,
  t: (key: string) => string,
): string {
  if (name === "comparison") return t("previousPeriod");
  if (name === "average") return t("movingAverage");
  if (name === "value") {
    return variant === "cumulative" ? t("cumulative") : t("total");
  }
  return String(name);
}
