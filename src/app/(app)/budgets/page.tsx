import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { setBudgetAction } from "@/app/actions/budgets.actions";
import { categories as categoriesComposition } from "@/composition/categories-composition";
import { budgets as budgetsComposition } from "@/composition/budget-composition";
import { YearMonth } from "@/shared/kernel/year-month";
import { BudgetCard } from "./_components/budget-card";

function parseMonthParam(value: string | undefined): YearMonth {
  if (value) {
    const parsed = YearMonth.parse(value);
    if (parsed.ok) return parsed.value;
  }
  return YearMonth.fromDate(new Date());
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { month } = await searchParams;
  const yearMonth = parseMonthParam(month);

  const categoryList = await categoriesComposition.list(userId);
  const budgetStatuses = await budgetsComposition.listForMonth(
    userId,
    yearMonth,
    categoryList,
  );

  const previousMonth = yearMonth.previous().toString();
  const nextMonth = yearMonth.next().toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <p className="mt-2 text-muted-foreground">
          Set monthly spending limits for each category.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/budgets?month=${previousMonth}`}
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
          href={`/budgets?month=${nextMonth}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {categoryList.length === 0 ? (
        <p className="text-muted-foreground">
          No categories yet. Create categories first so you can budget against
          them.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetStatuses.map((status) => (
            <BudgetCard
              key={status.category.id}
              status={status}
              yearMonth={yearMonth.toString()}
              action={setBudgetAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
