import { describe, expect, it } from "vitest";

import {
  addDays,
  bucketStart,
  bucketsBetween,
  dayBefore,
  monthRange,
  parseISODate,
  previousRange,
  toISODate,
} from "@/modules/reports/domain/dates";

describe("bucketsBetween", () => {
  it("generates daily buckets", () => {
    expect(bucketsBetween("2026-10-01", "2026-10-03", "day")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("generates Monday-based weekly buckets", () => {
    // 2026-10-09 is a Friday; its week starts Monday 2026-10-05.
    expect(bucketStart("2026-10-09", "week")).toEqual(parseISODate("2026-10-05"));
    expect(bucketsBetween("2026-10-09", "2026-10-12", "week")).toEqual([
      "2026-10-05",
      "2026-10-12",
    ]);
  });

  it("generates monthly buckets across a year boundary", () => {
    expect(bucketsBetween("2026-11-15", "2027-02-01", "month")).toEqual([
      "2026-11-01",
      "2026-12-01",
      "2027-01-01",
      "2027-02-01",
    ]);
  });
});

describe("monthRange", () => {
  it("covers the calendar month exclusively", () => {
    expect(monthRange(parseISODate("2026-10-09"))).toEqual({
      from: "2026-10-01",
      toExclusive: "2026-11-01",
    });
  });
});

describe("toISODate / parseISODate roundtrip", () => {
  it("roundtrips", () => {
    expect(toISODate(parseISODate("2026-02-28"))).toBe("2026-02-28");
  });
});

describe("dayBefore", () => {
  it("steps back one day, crossing a month boundary", () => {
    expect(dayBefore("2026-10-01")).toBe("2026-09-30");
  });

  it("steps back one day, crossing a leap day", () => {
    expect(dayBefore("2028-03-01")).toBe("2028-02-29");
  });
});

describe("previousRange", () => {
  it("returns the equal-length window ending where this one starts", () => {
    // 2026-10-01..2026-10-09 inclusive is 9 days, so the previous window
    // starts 9 days earlier.
    expect(previousRange("2026-10-01", "2026-10-10")).toEqual({
      from: "2026-09-22",
      toExclusive: "2026-10-01",
      toInclusive: "2026-09-30",
    });
  });

  it("keeps toInclusive adjacent to the window it precedes", () => {
    const prev = previousRange("2026-01-01", "2026-07-01");
    expect(prev.toInclusive).toBe("2025-12-31");
    expect(prev.toExclusive).toBe("2026-01-01");
  });

  it("survives a leap year without drifting a day", () => {
    // 2028-02-29 sits inside the window, so a naive 365-day shift would
    // land on 2027-02-28 instead of 2027-03-01.
    const prev = previousRange("2028-03-01", "2028-03-02");
    expect(prev.from).toBe("2028-02-29");
  });

  it("never returns an empty window", () => {
    // A zero-length range would divide by zero and yield a 1-day fallback.
    const prev = previousRange("2026-10-01", "2026-10-01");
    expect(prev.toExclusive).toBe("2026-10-01");
    expect(prev.from).toBe("2026-09-30");
  });
});

describe("previousRange bucket alignment", () => {
  /** A comparison chart zips the two windows by position, so they must agree
   *  on bucket count whenever the range comes from a preset. */
  const cases: [string, string, "day" | "week" | "month"][] = [
    ["2026-10-01", "2026-10-09", "day"],
    ["2026-09-10", "2026-10-09", "day"],
    ["2026-04-09", "2026-10-09", "week"],
    ["2026-04-09", "2026-10-09", "month"],
    ["2025-10-09", "2026-10-09", "month"],
  ];

  it.each(cases)(
    "lines up buckets for %s..%s at %s granularity",
    (from, to, granularity) => {
      const next = toISODate(addDays(parseISODate(to), 1));
      const prev = previousRange(from, next);
      expect(bucketsBetween(from, to, granularity)).toHaveLength(
        bucketsBetween(prev.from, prev.toInclusive, granularity).length,
      );
    },
  );

  it("can mismatch on an arbitrary custom range", () => {
    // The leading partial bucket of the previous window never materializes,
    // so the series are one short. This is why `alignComparison` pads at the
    // front with null instead of zero.
    const prev = previousRange("2026-01-31", "2026-04-01");
    expect(bucketsBetween("2026-01-31", "2026-03-31", "month")).toHaveLength(3);
    expect(
      bucketsBetween(prev.from, prev.toInclusive, "month"),
    ).toHaveLength(2);
  });
});
