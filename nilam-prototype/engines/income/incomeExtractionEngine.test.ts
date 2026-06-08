import { describe, it, expect } from "vitest";
import { extractIncome } from "./incomeExtractionEngine";
import { MUTASI } from "@/data/ocrFixtures";

describe("extractIncome", () => {
  it("correctly maps Gaji bucket to avg and min", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    const gaji = result.components.find((c) => c.key === "Gaji");
    expect(gaji?.avg).toBe(10_000_000);
    expect(gaji?.min).toBe(10_000_000);
  });

  it("correctly maps Bonus bucket (avg differs from min)", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    const bonus = result.components.find((c) => c.key === "Bonus");
    expect(bonus?.avg).toBe(30_000_000);
    expect(bonus?.min).toBe(10_000_000);
  });

  it("correctly maps Insentif bucket", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    const insentif = result.components.find((c) => c.key === "Insentif");
    expect(insentif?.avg).toBe(1_000_000);
    expect(insentif?.min).toBe(1_000_000);
  });

  it("sets default mode to avg and weight to 1", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    for (const comp of result.components) {
      expect(comp.mode).toBe("avg");
      expect(comp.weight).toBe(1);
    }
  });

  it("sets angsuran correctly", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    expect(result.angsuran).toBe(2_500_000);
  });

  it("sets role and name correctly", () => {
    const result = extractIncome("pasangan", "Damar Pratama", MUTASI, 1_500_000);
    expect(result.role).toBe("pasangan");
    expect(result.name).toBe("Damar Pratama");
  });

  it("produces exactly 4 components", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    expect(result.components.length).toBe(4);
  });

  it("correctly maps THR bucket to avg and min", () => {
    const result = extractIncome("nasabah", "Nasabah", MUTASI, 2_500_000);
    const thr = result.components.find((c) => c.key === "THR");
    expect(thr?.avg).toBe(20_000_000);
    expect(thr?.min).toBe(20_000_000);
  });
});
