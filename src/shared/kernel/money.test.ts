import { describe, expect, it } from "vitest";
import { Money } from "./money";

describe("Money", () => {
  describe("fromCents", () => {
    it("creates money from a non-negative integer", () => {
      const result = Money.fromCents(1234);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.cents).toBe(1234);
    });

    it("accepts zero", () => {
      expect(Money.fromCents(0).ok).toBe(true);
    });

    it("rejects negative amounts", () => {
      const result = Money.fromCents(-5);
      expect(result.ok).toBe(false);
    });

    it("rejects non-integer cents", () => {
      expect(Money.fromCents(10.5).ok).toBe(false);
    });

    it("rejects non-finite values", () => {
      expect(Money.fromCents(Number.NaN).ok).toBe(false);
      expect(Money.fromCents(Number.POSITIVE_INFINITY).ok).toBe(false);
    });
  });

  describe("fromEuros", () => {
    it("converts euros to cents", () => {
      const result = Money.fromEuros(12.34);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.cents).toBe(1234);
    });

    it("rounds float imprecision from user input", () => {
      const result = Money.fromEuros(0.1 + 0.2); // 0.30000000000000004
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.cents).toBe(30);
    });

    it("rejects negative euros", () => {
      expect(Money.fromEuros(-1).ok).toBe(false);
    });
  });

  describe("arithmetic", () => {
    it("adds two amounts", () => {
      const a = Money.reconstitute(1000);
      const b = Money.reconstitute(250);
      expect(a.add(b).cents).toBe(1250);
    });

    it("subtracts when result is non-negative", () => {
      const result = Money.reconstitute(1000).subtract(Money.reconstitute(400));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.cents).toBe(600);
    });

    it("fails to subtract into the negative", () => {
      const result = Money.reconstitute(100).subtract(Money.reconstitute(400));
      expect(result.ok).toBe(false);
    });

    it("subtractClamped clamps at zero", () => {
      const result = Money.reconstitute(100).subtractClamped(Money.reconstitute(400));
      expect(result.cents).toBe(0);
    });
  });

  describe("comparison and equality", () => {
    it("compares amounts", () => {
      const a = Money.reconstitute(500);
      const b = Money.reconstitute(300);
      expect(a.isGreaterThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(false);
      expect(a.isGreaterThanOrEqual(Money.reconstitute(500))).toBe(true);
    });

    it("is equal by value, not identity", () => {
      expect(Money.reconstitute(100).equals(Money.reconstitute(100))).toBe(true);
      expect(Money.reconstitute(100).equals(Money.reconstitute(200))).toBe(false);
      expect(Money.reconstitute(100).equals(null)).toBe(false);
    });

    it("detects zero", () => {
      expect(Money.zero().isZero()).toBe(true);
      expect(Money.reconstitute(1).isZero()).toBe(false);
    });
  });

  describe("formatting", () => {
    it("formats as localized EUR", () => {
      expect(Money.reconstitute(123456).format()).toContain("1.234,56");
    });

    it("exposes decimal euros", () => {
      expect(Money.reconstitute(99).toEuros()).toBe(0.99);
    });
  });
});
