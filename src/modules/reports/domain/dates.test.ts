import { describe, expect, it } from "vitest";

import {
  bucketStart,
  bucketsBetween,
  monthRange,
  parseISODate,
  toISODate,
} from "./dates";

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
