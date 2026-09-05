"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Money } from "@/shared/kernel/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BudgetVsActualItemDto } from "@/modules/dashboard/application/dashboard.dto";

export function BudgetVsActual({
  items,
}: {
  items: BudgetVsActualItemDto[];
}) {
  const chartConfig = items.reduce(
    (config, item) => {
      config[item.categoryId] = {
        label: item.name,
        color: item.color,
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>,
  );

  const chartData = items.map((item) => ({
    name: item.name,
    budget: item.budgetCents,
    actual: item.actualCents,
    fill: item.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs actual</CardTitle>
        <CardDescription>
          Planned spending compared to reality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No budgets or spending this month.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-video">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value: number) =>
                  Money.reconstitute(value).format()
                }
                hide
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => {
                      const num = typeof value === "number" ? value : 0;
                      return Money.reconstitute(num).format();
                    }}
                  />
                }
              />
              <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
