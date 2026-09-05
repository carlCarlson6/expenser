import { describe, expect, it } from "vitest";
import { YearMonth } from "@/shared/kernel/year-month";

describe("YearMonth", () => {
  describe("create", () => {
    it("creates a valid year-month", () => {
      const result = YearMonth.create(2026, 9);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.year).toBe(2026);
        expect(result.value.month).toBe(9);
      }
    });

    it("rejects month out of range", () => {
      expect(YearMonth.create(2026, 0).ok).toBe(false);
      expect(YearMonth.create(2026, 13).ok).toBe(false);
    });

    it("rejects non-integer input", () => {
      expect(YearMonth.create(2026, 2.5).ok).toBe(false);
    });
  });

  describe("parse", () => {
    it("parses a valid YYYY-MM string", () => {
      const result = YearMonth.parse("2026-09");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.toString()).toBe("2026-09");
    });

    it("rejects malformed strings", () => {
      expect(YearMonth.parse("2026-9").ok).toBe(false);
      expect(YearMonth.parse("26-09").ok).toBe(false);
      expect(YearMonth.parse("2026/09").ok).toBe(false);
      expect(YearMonth.parse("").ok).toBe(false);
    });

    it("rejects semantically invalid months", () => {
      expect(YearMonth.parse("2026-13").ok).toBe(false);
    });
  });

  describe("toString", () => {
    it("zero-pads the month", () => {
      expect(YearMonth.reconstitute(2026, 3).toString()).toBe("2026-03");
    });
  });

  describe("comparison", () => {
    it("orders months chronologically", () => {
      const jan = YearMonth.reconstitute(2026, 1);
      const feb = YearMonth.reconstitute(2026, 2);
      const prevDec = YearMonth.reconstitute(2025, 12);
      expect(jan.isBefore(feb)).toBe(true);
      expect(jan.isAfter(prevDec)).toBe(true);
      expect(prevDec.isBefore(jan)).toBe(true);
    });

    it("is equal by value", () => {
      expect(
        YearMonth.reconstitute(2026, 9).equals(YearMonth.reconstitute(2026, 9)),
      ).toBe(true);
      expect(
        YearMonth.reconstitute(2026, 9).equals(YearMonth.reconstitute(2026, 10)),
      ).toBe(false);
    });
  });

  describe("arithmetic", () => {
    it("moves to next and previous month", () => {
      expect(YearMonth.reconstitute(2026, 9).next().toString()).toBe("2026-10");
      expect(YearMonth.reconstitute(2026, 9).previous().toString()).toBe("2026-08");
    });

    it("rolls across year boundaries", () => {
      expect(YearMonth.reconstitute(2026, 12).next().toString()).toBe("2027-01");
      expect(YearMonth.reconstitute(2026, 1).previous().toString()).toBe("2025-12");
    });

    it("adds multiple months", () => {
      expect(YearMonth.reconstitute(2026, 11).addMonths(3).toString()).toBe("2027-02");
      expect(YearMonth.reconstitute(2026, 2).addMonths(-5).toString()).toBe("2025-09");
    });
  });

  describe("date range", () => {
    it("returns first and last day of a 31-day month", () => {
      const range = YearMonth.reconstitute(2026, 1).toDateRange();
      expect(range).toEqual({ start: "2026-01-01", end: "2026-01-31" });
    });

    it("returns first and last day of a 30-day month", () => {
      const range = YearMonth.reconstitute(2026, 9).toDateRange();
      expect(range).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    });

    it("handles February in a non-leap year", () => {
      const range = YearMonth.reconstitute(2026, 2).toDateRange();
      expect(range.end).toBe("2026-02-28");
    });

    it("handles February in a leap year", () => {
      const range = YearMonth.reconstitute(2028, 2).toDateRange();
      expect(range.end).toBe("2028-02-29");
    });
  });

  describe("daysInMonth", () => {
    it("returns the number of days", () => {
      expect(YearMonth.reconstitute(2026, 1).daysInMonth()).toBe(31);
      expect(YearMonth.reconstitute(2026, 4).daysInMonth()).toBe(30);
      expect(YearMonth.reconstitute(2028, 2).daysInMonth()).toBe(29);
    });
  });

  describe("lastNMonths", () => {
    it("returns the last N months ending at this one, oldest first", () => {
      const months = YearMonth.reconstitute(2026, 3).lastNMonths(3);
      expect(months.map((m) => m.toString())).toEqual([
        "2026-01",
        "2026-02",
        "2026-03",
      ]);
    });

    it("spans year boundaries", () => {
      const months = YearMonth.reconstitute(2026, 1).lastNMonths(3);
      expect(months.map((m) => m.toString())).toEqual([
        "2025-11",
        "2025-12",
        "2026-01",
      ]);
    });
  });

  describe("fromDate", () => {
    it("derives year and month from a Date", () => {
      const ym = YearMonth.fromDate(new Date(2026, 8, 15)); // Sep 15 2026 (month is 0-indexed)
      expect(ym.toString()).toBe("2026-09");
    });
  });
});
