import type { YearMonth } from "@/shared/kernel/year-month";

export interface MonthSummaryDto {
  spentCents: number;
  incomeCents: number;
  netCents: number;
  totalBudgetCents: number;
  remainingBudgetCents: number;
}

export interface CategoryBreakdownItemDto {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amountCents: number;
  percentOfTotal: number;
}

export interface BudgetVsActualItemDto {
  categoryId: string;
  name: string;
  color: string;
  budgetCents: number;
  actualCents: number;
}

export interface MonthlyTrendPointDto {
  yearMonth: string;
  spentCents: number;
  incomeCents: number;
  netCents: number;
}

export interface PacingDto {
  yearMonth: string;
  today: string;
  daysInMonth: number;
  currentDay: number;
  totalBudgetCents: number;
  actualCentsSoFar: number;
  expectedCentsSoFar: number;
  /** Cumulative expected and actual amounts for each day of the month. */
  days: PacingDayDto[];
}

export interface PacingDayDto {
  day: number;
  expectedCents: number;
  actualCents: number;
}

/**
 * Driven port that provides aggregated dashboard data. Implemented by the
 * infrastructure layer with raw SQL/Drizzle aggregates rather than by loading
 * domain aggregates.
 */
export interface DashboardReadModel {
  /** Summary numbers for the month: spent, income, net, budget, remaining. */
  getMonthSummary(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<MonthSummaryDto>;

  /** Expense breakdown by category for the donut chart. */
  getCategoryBreakdown(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<CategoryBreakdownItemDto[]>;

  /** Budget vs actual spending per category for the bar chart. */
  getBudgetVsActual(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<BudgetVsActualItemDto[]>;

  /** Income, expense and net totals for each month in the given range. */
  getMonthlyTrend(
    userId: string,
    months: YearMonth[],
  ): Promise<MonthlyTrendPointDto[]>;

  /**
   * Daily cumulative expected (linear from total budget) and actual spending
   * for the pacing line chart.
   */
  getPacing(
    userId: string,
    yearMonth: YearMonth,
    today: Date,
  ): Promise<PacingDto>;
}
