import { YearMonth } from "@/shared/kernel/year-month";
import type {
  BudgetVsActualItemDto,
  CategoryBreakdownItemDto,
  DashboardReadModel,
  MonthSummaryDto,
  MonthlyTrendPointDto,
  PacingDto,
} from "@/modules/dashboard/application/dashboard.dto";

export class TestDashboardReadModel implements DashboardReadModel {
  monthSummary: MonthSummaryDto = {
    spentCents: 0,
    incomeCents: 0,
    netCents: 0,
    totalBudgetCents: 0,
    remainingBudgetCents: 0,
  };

  categoryBreakdown: CategoryBreakdownItemDto[] = [];

  budgetVsActual: BudgetVsActualItemDto[] = [];

  monthlyTrend: MonthlyTrendPointDto[] = [];

  pacing: PacingDto = {
    yearMonth: "2026-09",
    today: new Date("2026-09-15").toISOString(),
    daysInMonth: 30,
    currentDay: 15,
    totalBudgetCents: 0,
    actualCentsSoFar: 0,
    expectedCentsSoFar: 0,
    days: [],
  };

  async getMonthSummary(
    _userId: string,
    _yearMonth: YearMonth,
  ): Promise<MonthSummaryDto> {
    return this.monthSummary;
  }

  async getCategoryBreakdown(
    _userId: string,
    _yearMonth: YearMonth,
  ): Promise<CategoryBreakdownItemDto[]> {
    return this.categoryBreakdown;
  }

  async getBudgetVsActual(
    _userId: string,
    _yearMonth: YearMonth,
  ): Promise<BudgetVsActualItemDto[]> {
    return this.budgetVsActual;
  }

  async getMonthlyTrend(
    _userId: string,
    _months: YearMonth[],
  ): Promise<MonthlyTrendPointDto[]> {
    return this.monthlyTrend;
  }

  async getPacing(
    _userId: string,
    _yearMonth: YearMonth,
    _today: Date,
  ): Promise<PacingDto> {
    return this.pacing;
  }
}
