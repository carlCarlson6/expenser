import { describe, expect, it } from "vitest";

import { parsePreset, presetGranularity } from "@/modules/reports/domain/period";

describe("parsePreset", () => {
  it("falls back to this month for missing or unknown values", () => {
    expect(parsePreset(undefined)).toBe("month");
    expect(parsePreset(["6m", "12m"])).toBe("month");
    expect(parsePreset("yesterday")).toBe("month");
  });

  it("never returns custom, which is expressed as explicit dates", () => {
    expect(parsePreset("custom")).toBe("month");
  });

  it("keeps a known preset", () => {
    expect(parsePreset("12m")).toBe("12m");
  });
});

describe("presetGranularity", () => {
  it("keeps every preset above a single bucket", () => {
    expect(presetGranularity("month")).toBe("day");
    expect(presetGranularity("30d")).toBe("day");
    expect(presetGranularity("6m")).toBe("week");
    expect(presetGranularity("12m")).toBe("month");
    expect(presetGranularity("custom")).toBe("day");
  });
});
