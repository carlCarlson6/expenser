import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { categories as categoriesComposition } from "@/composition/categories-composition";
import { dashboard as dashboardComposition } from "@/composition/dashboard-composition";
import { YearMonth } from "@/shared/kernel/year-month";
import { SummaryCards } from "./_components/summary-cards";
import { CategoryDonut } from "./_components/category-donut";
import { BudgetVsActual } from "./_components/budget-vs-actual";
import { MonthlyTrend } from "./_components/monthly-trend";
import { PacingChart } from "./_components/pacing-chart";
import { DashboardEmptyState } from "./_components/dashboard-empty-state";

function parseMonthParam(value: string | undefined): YearMonth {
  if (value) {
    const parsed = YearMonth.parse(value);
    if (parsed.ok) return parsed.value;
  }
  return YearMonth.fromDate(new Date());
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { month } = await searchParams;
  const yearMonth = parseMonthParam(month);

  await categoriesComposition.seedDefaults(userId);

  const monthsForTrend = yearMonth.lastNMonths(6);

  const [summary, breakdown, budgetVsActual, trend, pacing] = await Promise.all([
    dashboardComposition.getMonthSummary(userId, yearMonth),
    dashboardComposition.getCategoryBreakdown(userId, yearMonth),
    dashboardComposition.getBudgetVsActual(userId, yearMonth),
    dashboardComposition.getMonthlyTrend(userId, monthsForTrend),
    dashboardComposition.getPacing(userId, yearMonth),
  ]);

  const previousMonth = yearMonth.previous().toString();
  const nextMonth = yearMonth.next().toString();

  const hasAnyActivity =
    summary.spentCents > 0 ||
    summary.incomeCents > 0 ||
    breakdown.some((item) => item.amountCents > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Your spending overview for the month.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard?month=${previousMonth}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
        <span className="text-lg font-medium">
          {format(
            new Date(yearMonth.year, yearMonth.month - 1, 1),
            "MMMM yyyy",
          )}
        </span>
        <Link
          href={`/dashboard?month=${nextMonth}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <SummaryCards summary={summary} />

      {!hasAnyActivity ? (
        <DashboardEmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryDonut breakdown={breakdown} />
          <BudgetVsActual items={budgetVsActual} />
          <MonthlyTrend data={trend} className="lg:col-span-2" />
          <PacingChart pacing={pacing} className="lg:col-span-2" />
        </div>
      )}
    </div>
  );
}
