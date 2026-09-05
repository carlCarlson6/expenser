import { Money } from "@/shared/kernel/money";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonthSummaryDto } from "@/modules/dashboard/application/dashboard.dto";

export function SummaryCards({ summary }: { summary: MonthSummaryDto }) {
  const spent = Money.reconstitute(summary.spentCents).format();
  const income = Money.reconstitute(summary.incomeCents).format();
  const net = Money.reconstitute(Math.abs(summary.netCents)).format();
  const remaining = Money.reconstitute(summary.remainingBudgetCents).format();

  const netIsPositive = summary.netCents >= 0;

  const items = [
    { label: "Total spent", value: spent, tone: "default" as const },
    { label: "Total income", value: income, tone: "positive" as const },
    {
      label: "Net",
      value: `${netIsPositive ? "+" : "-"}${net}`,
      tone: netIsPositive ? "positive" : "negative",
    },
    { label: "Remaining budget", value: remaining, tone: "default" as const },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${
                item.tone === "positive"
                  ? "text-green-600"
                  : item.tone === "negative"
                    ? "text-destructive"
                    : ""
              }`}
            >
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
