import { db } from "@/db";
import { YearMonth } from "@/shared/kernel/year-month";
import { getMonthSummary } from "@/modules/dashboard/application/queries/get-month-summary.query";
import { getCategoryBreakdown } from "@/modules/dashboard/application/queries/get-category-breakdown.query";
import { getBudgetVsActual } from "@/modules/dashboard/application/queries/get-budget-vs-actual.query";
import { getMonthlyTrend } from "@/modules/dashboard/application/queries/get-monthly-trend.query";
import { getPacing } from "@/modules/dashboard/application/queries/get-pacing.query";
import { DrizzleDashboardReadModel } from "@/modules/dashboard/infrastructure/drizzle-dashboard.read-model";

const dashboardReadModel = new DrizzleDashboardReadModel(db);

export const dashboard = {
  getMonthSummary: (userId: string, yearMonth: YearMonth) =>
    getMonthSummary(yearMonth, { userId, readModel: dashboardReadModel }),

  getCategoryBreakdown: (userId: string, yearMonth: YearMonth) =>
    getCategoryBreakdown(yearMonth, { userId, readModel: dashboardReadModel }),

  getBudgetVsActual: (userId: string, yearMonth: YearMonth) =>
    getBudgetVsActual(yearMonth, { userId, readModel: dashboardReadModel }),

  getMonthlyTrend: (userId: string, months: YearMonth[]) =>
    getMonthlyTrend({ userId, months, readModel: dashboardReadModel }),

  getPacing: (userId: string, yearMonth: YearMonth, today = new Date()) =>
    getPacing({ userId, yearMonth, today, readModel: dashboardReadModel }),
};
