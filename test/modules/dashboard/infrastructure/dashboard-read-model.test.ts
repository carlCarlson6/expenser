import { describe, expect, it } from "vitest";
import { YearMonth } from "@/shared/kernel/year-month";
import { getMonthSummary } from "@/modules/dashboard/application/queries/get-month-summary.query";
import { getCategoryBreakdown } from "@/modules/dashboard/application/queries/get-category-breakdown.query";
import { getBudgetVsActual } from "@/modules/dashboard/application/queries/get-budget-vs-actual.query";
import { getMonthlyTrend } from "@/modules/dashboard/application/queries/get-monthly-trend.query";
import { getPacing } from "@/modules/dashboard/application/queries/get-pacing.query";
import { TestDashboardReadModel } from "./test-dashboard.read-model";

describe("Dashboard application queries", () => {
  const userId = "user_1";
  const yearMonth = YearMonth.reconstitute(2026, 9);

  describe("getMonthSummary", () => {
    it("returns the read model summary", async () => {
      const readModel = new TestDashboardReadModel();
      readModel.monthSummary = {
        spentCents: 10000,
        incomeCents: 20000,
        netCents: 10000,
        totalBudgetCents: 15000,
        remainingBudgetCents: 5000,
      };

      const result = await getMonthSummary(yearMonth, {
        userId,
        readModel,
      });

      expect(result.spentCents).toBe(10000);
      expect(result.netCents).toBe(10000);
    });
  });

  describe("getCategoryBreakdown", () => {
    it("returns the category breakdown", async () => {
      const readModel = new TestDashboardReadModel();
      readModel.categoryBreakdown = [
        {
          categoryId: "cat_1",
          name: "Food",
          color: "#22c55e",
          icon: "utensils",
          amountCents: 5000,
          percentOfTotal: 100,
        },
      ];

      const result = await getCategoryBreakdown(yearMonth, {
        userId,
        readModel,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Food");
    });
  });

  describe("getBudgetVsActual", () => {
    it("returns budget vs actual data", async () => {
      const readModel = new TestDashboardReadModel();
      readModel.budgetVsActual = [
        {
          categoryId: "cat_1",
          name: "Food",
          color: "#22c55e",
          budgetCents: 10000,
          actualCents: 6000,
        },
      ];

      const result = await getBudgetVsActual(yearMonth, {
        userId,
        readModel,
      });

      expect(result[0].budgetCents).toBe(10000);
      expect(result[0].actualCents).toBe(6000);
    });
  });

  describe("getMonthlyTrend", () => {
    it("returns trend data for the requested months", async () => {
      const readModel = new TestDashboardReadModel();
      readModel.monthlyTrend = [
        {
          yearMonth: "2026-08",
          spentCents: 8000,
          incomeCents: 10000,
          netCents: 2000,
        },
      ];

      const result = await getMonthlyTrend({
        userId,
        months: [YearMonth.reconstitute(2026, 8)],
        readModel,
      });

      expect(result).toHaveLength(1);
      expect(result[0].yearMonth).toBe("2026-08");
      expect(result[0].netCents).toBe(2000);
    });
  });

  describe("getPacing", () => {
    it("returns pacing data for the month", async () => {
      const readModel = new TestDashboardReadModel();
      const today = new Date("2026-09-10");
      readModel.pacing = {
        yearMonth: yearMonth.toString(),
        today: today.toISOString(),
        daysInMonth: 30,
        currentDay: 10,
        totalBudgetCents: 30000,
        actualCentsSoFar: 12000,
        expectedCentsSoFar: 10000,
        days: [],
      };

      const result = await getPacing({
        userId,
        yearMonth,
        today,
        readModel,
      });

      expect(result.currentDay).toBe(10);
      expect(result.actualCentsSoFar).toBe(12000);
    });
  });
});
