import { describe, it, expect } from "vitest";
import {
  analyzeOcrCoverage,
  monthFromKey,
  monthRange,
  monthRangeBetween,
} from "./coverage";

describe("monthFromKey", () => {
  it("maps a key to short + full Indonesian labels", () => {
    expect(monthFromKey("2025-11")).toEqual({
      key: "2025-11",
      short: "Nov",
      label: "Nov 2025",
    });
    expect(monthFromKey("2026-01").label).toBe("Jan 2026");
  });
});

describe("monthRange / monthRangeBetween", () => {
  it("returns `count` consecutive months ending at endKey, ascending", () => {
    const r = monthRange("2026-03", 12);
    expect(r).toHaveLength(12);
    expect(r[0].key).toBe("2025-04");
    expect(r[r.length - 1].key).toBe("2026-03");
  });

  it("spans inclusively between two keys", () => {
    const r = monthRangeBetween("2025-04", "2026-03").map((m) => m.key);
    expect(r).toHaveLength(12);
    expect(r[0]).toBe("2025-04");
    expect(r[11]).toBe("2026-03");
  });
});

describe("analyzeOcrCoverage", () => {
  const MUTASI_FULL = [
    "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09",
    "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  ];

  it("reports complete coverage for a contiguous 12-month upload", () => {
    const res = analyzeOcrCoverage(MUTASI_FULL, 12);
    expect(res.isComplete).toBe(true);
    expect(res.missing).toEqual([]);
    expect(res.meetsMinimum).toBe(true);
    expect(res.rangeLabel).toBe("Apr 2025 – Mar 2026");
    expect(res.detected).toHaveLength(12);
    expect(res.expected).toHaveLength(12);
  });

  it("flags an interior gap and reports X-of-Y (11 of 12, Nov missing)", () => {
    const withGap = MUTASI_FULL.filter((k) => k !== "2025-11");
    const res = analyzeOcrCoverage(withGap, 12);
    expect(res.isComplete).toBe(false);
    expect(res.missing.map((m) => m.key)).toEqual(["2025-11"]);
    expect(res.missing[0].label).toBe("Nov 2025");
    // Span (first → last) still spans the full 12 months → "11 of 12".
    expect(res.rangeLabel).toBe("Apr 2025 – Mar 2026");
    expect(res.expected).toHaveLength(12); // Y = 12
    expect(res.detected).toHaveLength(11); // X = 11
    expect(res.meetsMinimum).toBe(true); // period still covers 12 months
  });

  it("does not meet a 12-month minimum when the span is shorter", () => {
    const sixMonths = [
      "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
    ];
    const res = analyzeOcrCoverage(sixMonths, 12);
    expect(res.isComplete).toBe(true); // contiguous, no interior gap
    expect(res.meetsMinimum).toBe(false); // span is only 6 < 12
    expect(res.rangeLabel).toBe("Okt 2025 – Mar 2026");
  });

  it("handles a contiguous slip-gaji set (no gap, min 3)", () => {
    const res = analyzeOcrCoverage(["2026-01", "2026-02", "2026-03"], 3);
    expect(res.isComplete).toBe(true);
    expect(res.meetsMinimum).toBe(true);
  });

  it("sorts unordered input before analysing", () => {
    const res = analyzeOcrCoverage(["2026-03", "2026-01", "2026-02"], 3);
    expect(res.detected.map((m) => m.key)).toEqual([
      "2026-01", "2026-02", "2026-03",
    ]);
    expect(res.isComplete).toBe(true);
  });

  it("returns an empty report for no detected months", () => {
    const res = analyzeOcrCoverage([], 6);
    expect(res.expected).toEqual([]);
    expect(res.missing).toEqual([]);
    expect(res.rangeLabel).toBe("");
    expect(res.meetsMinimum).toBe(false);
  });
});
