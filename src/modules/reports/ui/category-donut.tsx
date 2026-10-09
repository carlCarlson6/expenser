"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { currencyFormatter } from "./format";

/** Category split for the period, as slices of the whole. */
export function CategoryDonut({
  items,
  currency,
  locale,
}: {
  items: { name: string; color: string; totalCents: number }[];
  currency: string;
  locale: string;
}) {
  const fmt = currencyFormatter(currency, locale);
  const data = items.map((i) => ({
    name: i.name,
    value: i.totalCents / 100,
    color: i.color,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value, name) => [fmt(Number(value)), String(name)]}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}