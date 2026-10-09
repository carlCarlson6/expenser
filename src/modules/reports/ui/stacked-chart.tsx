"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StackedCategory } from "../domain/stacked";
import { currencyFormatter } from "./format";

export function StackedChart({
  data,
  categories,
  otherName,
  currency,
  locale,
}: {
  /** One row per bucket, carrying a numeric key per category id. */
  data: Record<string, number | string>[];
  categories: StackedCategory[];
  /** Localized label for the rolled-up tail category. */
  otherName: string;
  currency: string;
  locale: string;
}) {
  const fmt = currencyFormatter(currency, locale);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            formatter={(value, name) => [
              fmt(Number(value)),
              categoryName(name, categories, otherName),
            ]}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {categories.map((c) => (
            <Bar
              key={c.categoryId}
              dataKey={c.categoryId}
              stackId="total"
              fill={c.color}
              name={c.name || otherName}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Recharts hands back the dataKey (the category id), not the display name. */
function categoryName(
  key: unknown,
  categories: StackedCategory[],
  otherName: string,
): string {
  const found = categories.find((c) => c.categoryId === key);
  return found ? found.name || otherName : String(key);
}
