import type { SlikLoan } from "@/types/profile";

/**
 * Mock SLIK OJK loan list — every credit facility the customer has/had.
 *
 * The total monthly installment (2.5jt + 1jt + 0 = 3.5jt) is kept consistent
 * with data/slikFixtures.ts → SLIK_NASABAH.angsuranBulanan (3.500.000), which
 * feeds the installment calculation.
 *
 * ── FUTURE API SWAP ───────────────────────────────────────────────────────
 * Replace this constant with the SLIK endpoint's response (same shape).
 */
export const SLIK_LOANS: SlikLoan[] = [
  { jenis: "KPR",          lembaga: "Bank BRI",    plafon: 250_000_000, baki: 120_000_000, angsuran: 2_500_000, status: "Lancar", kualitas: 1 },
  { jenis: "KKB",          lembaga: "BRI Finance", plafon: 180_000_000, baki: 30_000_000,  angsuran: 1_000_000, status: "Lancar", kualitas: 1 },
  { jenis: "Kartu Kredit", lembaga: "Bank BRI",    plafon: 25_000_000,  baki: 0,           angsuran: 0,         status: "Lancar", kualitas: 1 },
];

/** Total monthly installment across all reported SLIK facilities. */
export const SLIK_TOTAL_ANGSURAN = SLIK_LOANS.reduce((sum, l) => sum + l.angsuran, 0);
