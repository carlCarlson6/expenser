"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Money } from "@/shared/kernel/money";
import { cn } from "@/lib/utils";
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
import type { PacingDto } from "@/modules/dashboard/application/dashboard.dto";

interface PacingChartProps {
  pacing: PacingDto;
  className?: string;
}

export function PacingChart({ pacing, className }: PacingChartProps) {
  const chartConfig = {
    expected: { label: "Expected pace", color: "hsl(var(--muted-foreground))" },
    actual: { label: "Actual spending", color: "hsl(var(--primary))" },
  };

  const chartData = pacing.days.map((day) => ({
    day: day.day,
    expected: day.expectedCents,
    actual: day.actualCents,
  }));

  const hasBudget = pacing.totalBudgetCents > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Spending pace</CardTitle>
        <CardDescription>
          Cumulative spending vs a linear budget pace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasBudget ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Set a monthly budget to see your spending pace.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Today</p>
                <p className="font-medium">Day {pacing.currentDay}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Expected so far</p>
                <p className="font-medium">
                  {Money.reconstitute(pacing.expectedCentsSoFar).format()}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Actual so far</p>
                <p
                  className={cn(
                    "font-medium",
                    pacing.actualCentsSoFar > pacing.expectedCentsSoFar &&
                      "text-destructive",
                  )}
                >
                  {Money.reconstitute(pacing.actualCentsSoFar).format()}
                </p>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="aspect-video">
              <LineChart data={chartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
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
                <ReferenceLine
                  x={pacing.currentDay}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="4 4"
                  label={{
                    value: "Today",
                    position: "insideTopRight",
                    fill: "hsl(var(--destructive))",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
