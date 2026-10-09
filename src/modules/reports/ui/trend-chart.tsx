"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({
  data,
  currency,
  locale,
}: {
  /** value in major currency units (e.g. euros). */
  data: { label: string; value: number }[];
  currency: string;
  locale: string;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#27272a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
