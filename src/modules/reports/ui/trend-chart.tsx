"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { toCumulative, type ChartPoint, type TrendVariant } from "./chart";
import { ALL_CATEGORIES_COLOR } from "./colors";
import { currencyFormatter } from "./format";

const MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

export function TrendChart({
  data,
  currency,
  locale,
  color = ALL_CATEGORIES_COLOR,
  variant = "bar",
}: {
  /** value in major currency units (e.g. euros). */
  data: ChartPoint[];
  currency: string;
  locale: string;
  /** Stroke/fill tint: the category color when filtered to one, neutral
   *  otherwise. */
  color?: string;
  /** Chart shape over the same series; `cumulative` plots the running total. */
  variant?: TrendVariant;
}) {
  const fmt = currencyFormatter(currency, locale);
  const points = variant === "cumulative" ? toCumulative(data) : data;

  // Axes and tooltip do not depend on the shape: rendered once and shared.
  const chrome = (
    <>
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        fontSize={12}
        stroke="#71717a"
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
        formatter={(value) => [fmt(Number(value))]}
        // Bars highlight the hovered slice; lines highlight the whole column.
        cursor={
          variant === "bar"
            ? { fill: "rgba(0,0,0,0.05)" }
            : { stroke: "#d4d4d8", strokeWidth: 1 }
        }
      />
    </>
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={points} margin={MARGIN}>
            {chrome}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color} />
          </BarChart>
        ) : variant === "area" ? (
          <AreaChart data={points} margin={MARGIN}>
            {chrome}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.25}
            />
          </AreaChart>
        ) : (
          <LineChart data={points} margin={MARGIN}>
            {chrome}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}