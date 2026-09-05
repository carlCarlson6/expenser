import { and, between, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { YearMonth } from "@/shared/kernel/year-month";
import { categories } from "@/modules/categories/infrastructure/categories.schema";
import { budgets } from "@/modules/budgets/infrastructure/budgets.schema";
import {
  transactions,
  type TransactionRow,
} from "@/modules/ledger/infrastructure/transactions.schema";
import type {
  BudgetVsActualItemDto,
  CategoryBreakdownItemDto,
  DashboardReadModel,
  MonthSummaryDto,
  MonthlyTrendPointDto,
  PacingDayDto,
  PacingDto,
} from "../application/dashboard.dto";

function toCents(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class DrizzleDashboardReadModel implements DashboardReadModel {
  constructor(private readonly db: NodePgDatabase) {}

  async getMonthSummary(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<MonthSummaryDto> {
    const range = yearMonth.toDateRange();

    const [expenseRow] = await this.db
      .select({ total: sql<number>`sum(${transactions.amountCents})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          between(transactions.date, range.start, range.end),
        ),
      );

    const [incomeRow] = await this.db
      .select({ total: sql<number>`sum(${transactions.amountCents})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          between(transactions.date, range.start, range.end),
        ),
      );

    const [budgetRow] = await this.db
      .select({ total: sql<number>`sum(${budgets.amountCents})` })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.year, yearMonth.year),
          eq(budgets.month, yearMonth.month),
        ),
      );

    const spentCents = toCents(expenseRow?.total);
    const incomeCents = toCents(incomeRow?.total);
    const totalBudgetCents = toCents(budgetRow?.total);
    const netCents = incomeCents - spentCents;
    const remainingBudgetCents = Math.max(0, totalBudgetCents - spentCents);

    return {
      spentCents,
      incomeCents,
      netCents,
      totalBudgetCents,
      remainingBudgetCents,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<CategoryBreakdownItemDto[]> {
    const range = yearMonth.toDateRange();

    const rows = await this.db
      .select({
        categoryId: categories.id,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
        amountCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
      })
      .from(categories)
      .leftJoin(
        transactions,
        and(
          eq(categories.id, transactions.categoryId),
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          between(transactions.date, range.start, range.end),
        ),
      )
      .where(eq(categories.userId, userId))
      .groupBy(categories.id, categories.name, categories.color, categories.icon)
      .orderBy(sql`coalesce(sum(${transactions.amountCents}), 0) desc`);

    const total = rows.reduce((sum, row) => sum + toCents(row.amountCents), 0);

    return rows.map((row) => {
      const amountCents = toCents(row.amountCents);
      return {
        categoryId: row.categoryId,
        name: row.name,
        color: row.color,
        icon: row.icon,
        amountCents,
        percentOfTotal: total > 0 ? Math.round((amountCents / total) * 100) : 0,
      };
    });
  }

  async getBudgetVsActual(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<BudgetVsActualItemDto[]> {
    const range = yearMonth.toDateRange();

    const rows = await this.db
      .select({
        categoryId: categories.id,
        name: categories.name,
        color: categories.color,
        budgetCents: sql<number>`coalesce(sum(distinct ${budgets.amountCents}), 0)`,
        actualCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
      })
      .from(categories)
      .leftJoin(
        budgets,
        and(
          eq(categories.id, budgets.categoryId),
          eq(budgets.userId, userId),
          eq(budgets.year, yearMonth.year),
          eq(budgets.month, yearMonth.month),
        ),
      )
      .leftJoin(
        transactions,
        and(
          eq(categories.id, transactions.categoryId),
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          between(transactions.date, range.start, range.end),
        ),
      )
      .where(eq(categories.userId, userId))
      .groupBy(categories.id, categories.name, categories.color);

    return rows
      .map((row) => ({
        categoryId: row.categoryId,
        name: row.name,
        color: row.color,
        budgetCents: toCents(row.budgetCents),
        actualCents: toCents(row.actualCents),
      }))
      .filter((row) => row.budgetCents > 0 || row.actualCents > 0)
      .sort((a, b) => b.actualCents - a.actualCents);
  }

  async getMonthlyTrend(
    userId: string,
    months: YearMonth[],
  ): Promise<MonthlyTrendPointDto[]> {
    if (months.length === 0) return [];

    const start = months[0].toDateRange().start;
    const end = months[months.length - 1].toDateRange().end;

    const rows = await this.db
      .select({
        year: sql<number>`extract(year from ${transactions.date})`,
        month: sql<number>`extract(month from ${transactions.date})`,
        type: transactions.type,
        total: sql<number>`sum(${transactions.amountCents})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          between(transactions.date, start, end),
        ),
      )
      .groupBy(
        sql`extract(year from ${transactions.date})`,
        sql`extract(month from ${transactions.date})`,
        transactions.type,
      );

    const totalsByMonth = new Map<string, { spent: number; income: number }>();
    for (const row of rows) {
      const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
      const current = totalsByMonth.get(key) ?? { spent: 0, income: 0 };
      if (row.type === "expense") {
        current.spent = toCents(row.total);
      } else {
        current.income = toCents(row.total);
      }
      totalsByMonth.set(key, current);
    }

    return months.map((yearMonth) => {
      const key = yearMonth.toString();
      const { spent, income } = totalsByMonth.get(key) ?? {
        spent: 0,
        income: 0,
      };
      return {
        yearMonth: key,
        spentCents: spent,
        incomeCents: income,
        netCents: income - spent,
      };
    });
  }

  async getPacing(
    userId: string,
    yearMonth: YearMonth,
    today: Date,
  ): Promise<PacingDto> {
    const range = yearMonth.toDateRange();
    const daysInMonth = yearMonth.daysInMonth();
    const currentDay = Math.min(today.getDate(), daysInMonth);

    const [budgetRow] = await this.db
      .select({ total: sql<number>`sum(${budgets.amountCents})` })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.year, yearMonth.year),
          eq(budgets.month, yearMonth.month),
        ),
      );
    const totalBudgetCents = toCents(budgetRow?.total);

    const txRows: Pick<TransactionRow, "date" | "amountCents">[] =
      await this.db
        .select({ date: transactions.date, amountCents: transactions.amountCents })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            between(transactions.date, range.start, range.end),
          ),
        )
        .orderBy(transactions.date);

    const actualByDay = new Map<number, number>();
    for (const row of txRows) {
      const day = Number(row.date.slice(-2));
      actualByDay.set(day, (actualByDay.get(day) ?? 0) + row.amountCents);
    }

    const days: PacingDayDto[] = [];
    let cumulativeActual = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      cumulativeActual += actualByDay.get(day) ?? 0;
      const expectedCents = Math.round((totalBudgetCents / daysInMonth) * day);
      days.push({
        day,
        expectedCents,
        actualCents: cumulativeActual,
      });
    }

    const actualCentsSoFar = days[currentDay - 1]?.actualCents ?? 0;
    const expectedCentsSoFar = days[currentDay - 1]?.expectedCents ?? 0;

    return {
      yearMonth: yearMonth.toString(),
      today: today.toISOString(),
      daysInMonth,
      currentDay,
      totalBudgetCents,
      actualCentsSoFar,
      expectedCentsSoFar,
      days,
    };
  }
}
