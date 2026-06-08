import type { MutationRecord } from "@/types/profile";
import { MUTASI } from "./ocrFixtures";

/**
 * Mock mutation record — the credits detected in the customer's bank mutation
 * (mutasi rekening): Salary, THR, Bonus, and any other incoming credit.
 *
 * The first four rows are derived from the existing OCR mutation fixture
 * (data/ocrFixtures.ts → MUTASI) so the numbers stay in sync with the OCR
 * Result card. The trailing "other credit" rows demonstrate non-payroll credits
 * that show up in a real mutation but are NOT part of the income components.
 *
 * ── FUTURE API SWAP ──────────────────────────────────────────────────────
 * Replace this constant with the mutation endpoint's response (same shape).
 */
export const MUTATION_RECORD: MutationRecord = {
  periodLabel: "Apr 2025 – Mar 2026",
  credits: [
    { label: "Gaji",     category: "salary", ...MUTASI.Gaji },
    { label: "THR",      category: "thr",    ...MUTASI.THR },
    { label: "Bonus",    category: "bonus",  ...MUTASI.Bonus },
    { label: "Insentif", category: "other",  ...MUTASI.Insentif },
    { label: "Transfer Masuk Lain", category: "other", count: 3, sum: 7_500_000, min: 1_500_000 },
    { label: "Refund / Reimburse",  category: "other", count: 2, sum: 2_400_000, min: 1_000_000 },
  ],
};
