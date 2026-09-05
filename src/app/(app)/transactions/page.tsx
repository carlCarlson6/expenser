import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { createTransactionAction } from "@/app/actions/transactions.actions";
import { categories as categoriesComposition } from "@/composition/categories-composition";
import { ledger } from "@/composition/ledger-composition";
import { Money } from "@/shared/kernel/money";
import { YearMonth } from "@/shared/kernel/year-month";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryIcon } from "@/components/category-icon";
import { TransactionActions } from "./_components/transaction-actions";
import { TransactionForm } from "./_components/transaction-form";

function parseMonthParam(value: string | undefined): YearMonth {
  if (value) {
    const parsed = YearMonth.parse(value);
    if (parsed.ok) return parsed.value;
  }
  return YearMonth.fromDate(new Date());
}

function groupByDate<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const existing = groups.get(item.date);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.date, [item]);
    }
  }
  return groups;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { month } = await searchParams;
  const yearMonth = parseMonthParam(month);

  const [categoryList, transactionList] = await Promise.all([
    categoriesComposition.list(userId),
    ledger.listForMonth(userId, yearMonth),
  ]);

  const grouped = groupByDate(transactionList);
  const previousMonth = yearMonth.previous().toString();
  const nextMonth = yearMonth.next().toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-2 text-muted-foreground">
            Your expenses and income for the month.
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add transaction
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              action={createTransactionAction}
              categories={categoryList}
              submitLabel="Create transaction"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/transactions?month=${previousMonth}`}
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
          href={`/transactions?month=${nextMonth}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {transactionList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No transactions this month. Add your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {transaction.category ? (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: transaction.category.color }}
                        >
                          <CategoryIcon
                            name={transaction.category.icon}
                            className="h-4 w-4 text-white"
                          />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Plus className="h-4 w-4 rotate-45" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {transaction.note ||
                            (transaction.type === "income"
                              ? "Income"
                              : transaction.category?.name ?? "Expense")}
                        </p>
                        {transaction.category && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.category.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {Money.reconstitute(
                          transaction.amountCents,
                        ).format()}
                      </span>
                      <TransactionActions
                        transaction={transaction}
                        categories={categoryList}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
