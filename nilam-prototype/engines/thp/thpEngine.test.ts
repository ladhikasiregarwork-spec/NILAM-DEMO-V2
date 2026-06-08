import { describe, it, expect } from "vitest";
import { adjusted, computeThp, computeJointThp } from "./thpEngine";
import type { CustomerIncome, IncomeComponent } from "@/types/income";
import { NASABAH_INCOME, PASANGAN_INCOME } from "@/data/incomeFixtures";

const comp = (over: Partial<IncomeComponent>): IncomeComponent => ({
  key: "Gaji", avg: 10_000_000, min: 10_000_000, mode: "avg", weight: 1, ...over,
});

const nasabah = (): CustomerIncome => ({
  role: "nasabah", name: "Nasabah", angsuran: 2_500_000,
  components: [
    comp({ key: "Gaji", avg: 10_000_000, min: 10_000_000 }),
    comp({ key: "THR", avg: 20_000_000, min: 20_000_000 }),
    comp({ key: "Bonus", avg: 30_000_000, min: 10_000_000 }),
    comp({ key: "Insentif", avg: 1_000_000, min: 1_000_000 }),
  ],
});

describe("adjusted", () => {
  it("uses avg * weight in avg mode (spec example: 10jt * 0.5 = 5jt)", () => {
    expect(adjusted(comp({ avg: 10_000_000, mode: "avg", weight: 0.5 }))).toBe(5_000_000);
  });
  it("uses min * weight in min mode", () => {
    expect(adjusted(comp({ min: 8_000_000, mode: "min", weight: 1 }))).toBe(8_000_000);
  });
});

describe("computeThp", () => {
  it("THP = sum(adjusted) - angsuran at full weight/avg", () => {
    const r = computeThp(nasabah());
    expect(r.grossBeforeAngsuran).toBe(61_000_000);
    expect(r.thp).toBe(58_500_000);
    expect(r.adjusted.Gaji).toBe(10_000_000);
  });

  it("uses min value when mode is min", () => {
    const cust: CustomerIncome = {
      role: "nasabah", name: "Test", angsuran: 0,
      components: [{ key: "Gaji", avg: 10_000_000, min: 7_000_000, mode: "min", weight: 1 }],
    };
    expect(computeThp(cust).thp).toBe(7_000_000);
  });
});

describe("computeJointThp", () => {
  it("total = nasabah.thp + pasangan.thp", () => {
    const p: CustomerIncome = { ...nasabah(), role: "pasangan", name: "Pasangan", angsuran: 1_500_000 };
    const r = computeJointThp(nasabah(), p);
    expect(r.total).toBe(118_000_000);
  });
  it("total = nasabah.thp when no pasangan", () => {
    const r = computeJointThp(nasabah());
    expect(r.total).toBe(58_500_000);
  });
});

// ---------------------------------------------------------------------------
// Reference-fixture sanity: NASABAH_INCOME, PASANGAN_INCOME from incomeFixtures
// ---------------------------------------------------------------------------

describe("computeThp — reference fixture sanity", () => {
  it("NASABAH_INCOME THP = 21_000_000", () => {
    // Gaji: 10M*0.5=5M, THR: 20M*0.5=10M, Bonus: 30M*0.3=9M, Insentif: 1M*0.5=0.5M
    // gross = 24.5M, angsuran = 3.5M, THP = 21M
    expect(computeThp(NASABAH_INCOME).thp).toBe(21_000_000);
  });

  it("PASANGAN_INCOME THP = 17_500_000", () => {
    // Gaji: 8M*0.5=4M, THR: 16M*0.5=8M, Bonus: 20M*0.5=10M, Insentif: 0.8M*0.5=0.4M
    // gross = 22.4M, angsuran = 4.9M, THP = 17.5M
    expect(computeThp(PASANGAN_INCOME).thp).toBe(17_500_000);
  });

  it("Joint THP total = 38_500_000 (21M + 17.5M)", () => {
    expect(computeJointThp(NASABAH_INCOME, PASANGAN_INCOME).total).toBe(38_500_000);
  });
});
