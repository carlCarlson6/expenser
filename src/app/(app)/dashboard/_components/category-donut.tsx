"use client";

import { Pie, PieChart } from "recharts";
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
import { CategoryIcon } from "@/components/category-icon";
import type { CategoryBreakdownItemDto } from "@/modules/dashboard/application/dashboard.dto";

export function CategoryDonut({
  breakdown,
}: {
  breakdown: CategoryBreakdownItemDto[];
}) {
  const activeItems = breakdown.filter((item) => item.amountCents > 0);

  const chartConfig = activeItems.reduce(
    (config, item) => {
      config[item.categoryId] = {
        label: item.name,
        color: item.color,
      };
      return config;
    },
    {} as Record<string, { label: string; color: string }>,
  );

  const chartData = activeItems.map((item) => ({
    id: item.categoryId,
    name: item.name,
    value: item.amountCents,
    fill: item.color,
  }));

  const totalCents = activeItems.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
        <CardDescription>
          Where your money went this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No expenses yet. Add transactions to see your breakdown.
          </p>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[240px] min-w-[240px]"
            >
              <PieChart>
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
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                />
              </PieChart>
            </ChartContainer>

            <div className="flex-1 space-y-2">
              {activeItems.slice(0, 6).map((item) => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon
                        name={item.icon}
                        className="h-3 w-3 text-white"
                      />
                    </span>
                    <span className="truncate text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="font-medium">
                      {Money.reconstitute(item.amountCents).format()}
                    </span>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {item.percentOfTotal}%
                    </span>
                  </div>
                </div>
              ))}
              {activeItems.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{activeItems.length - 6} more categories
                </p>
              )}
              <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                <span>Total</span>
                <span>{Money.reconstitute(totalCents).format()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
