import type { BankStatementRow } from "@/types/profile";

/**
 * Mock per-month bank-statement credits (mutasi rekening), Apr 2025 – Mar 2026.
 *
 * Broken out by category so the dashboard can render a month-by-month table.
 * Column totals are kept consistent with data/ocrFixtures.ts → MUTASI and
 * data/mutationFixtures.ts:
 *   Salary    12 × 10jt = 120jt
 *   THR        1 ×       =  20jt
 *   Bonus      2 ×       =  60jt  (50jt + 10jt)
 *   Incentive  6 × 1jt   =   6jt
 *   Other      transfers 7,5jt + refunds 2,4jt = 9,9jt
 *
 * ── FUTURE API SWAP ───────────────────────────────────────────────────────
 * Replace this constant with the bank-statement endpoint's response.
 */
export const BANK_STATEMENT_ROWS: BankStatementRow[] = [
  { month: "Apr 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 0,         other: 0 },
  { month: "Mei 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 1_000_000, other: 0 },
  { month: "Jun 2025", salary: 10_000_000, thr: 20_000_000, bonus: 0,          incentive: 0,         other: 0 },
  { month: "Jul 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 1_000_000, other: 0 },
  { month: "Agu 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 0,         other: 2_500_000 },
  { month: "Sep 2025", salary: 10_000_000, thr: 0,          bonus: 10_000_000, incentive: 1_000_000, other: 0 },
  { month: "Okt 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 0,         other: 1_400_000 },
  { month: "Nov 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 1_000_000, other: 0 },
  { month: "Des 2025", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 0,         other: 2_500_000 },
  { month: "Jan 2026", salary: 10_000_000, thr: 0,          bonus: 50_000_000, incentive: 1_000_000, other: 0 },
  { month: "Feb 2026", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 0,         other: 2_500_000 },
  { month: "Mar 2026", salary: 10_000_000, thr: 0,          bonus: 0,          incentive: 1_000_000, other: 1_000_000 },
];

/** Sum a single credit column across all months. */
export function bankColumnTotal(key: keyof Omit<BankStatementRow, "month">): number {
  return BANK_STATEMENT_ROWS.reduce((sum, r) => sum + r[key], 0);
}

/** Total of one month's credits (all categories). */
export function bankRowTotal(r: BankStatementRow): number {
  return r.salary + r.thr + r.bonus + r.incentive + r.other;
}
