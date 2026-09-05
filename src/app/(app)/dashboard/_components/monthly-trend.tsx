"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
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
import type { MonthlyTrendPointDto } from "@/modules/dashboard/application/dashboard.dto";

interface MonthlyTrendProps {
  data: MonthlyTrendPointDto[];
  className?: string;
}

export function MonthlyTrend({ data, className }: MonthlyTrendProps) {
  const chartConfig = {
    spent: { label: "Spent", color: "hsl(var(--primary))" },
    income: { label: "Income", color: "hsl(var(--muted-foreground))" },
    net: { label: "Net", color: "hsl(var(--success))" },
  };

  const chartData = data.map((point) => ({
    label: point.yearMonth,
    spent: point.spentCents,
    income: point.incomeCents,
    net: point.netCents,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>6-month trend</CardTitle>
        <CardDescription>
          Income, spending, and net over the last six months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.every(
          (point) => point.spent === 0 && point.income === 0,
        ) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data for the selected period. Add transactions to see trends.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-video">
            <AreaChart data={chartData} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value: number) =>
                  Money.reconstitute(value).format()
                }
                width={64}
                tick={{ fontSize: 12 }}
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
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
