import type { SlikLoan } from "@/types/profile";

/**
 * Mock SLIK OJK loan list — every credit facility the customer has/had.
 *
 * Sourced from SLIK.csv (2 facilities): a Kartu Kredit at Bank Central Asia
 * (lunas, Kol 1) and an active Kredit Multiguna at Bank Rakyat Indonesia
 * (Kol 1). The total monthly installment (0 + 2.991.575 = 2.991.575) is kept
 * consistent with data/slikFixtures.ts → SLIK_NASABAH.angsuranBulanan.
 *
 * ── FUTURE API SWAP ───────────────────────────────────────────────────────
 * Replace this constant with the SLIK endpoint's response (same shape).
 */
export const SLIK_LOANS: SlikLoan[] = [
  { jenis: "Kartu Kredit", lembaga: "Bank Central Asia",    plafon: 6_000_000,   baki: 0,           angsuran: 0,         status: "Lunas",  kualitas: 1, aktif: false },
  { jenis: "Multiguna",    lembaga: "Bank Rakyat Indonesia", plafon: 259_000_000, baki: 235_880_725, angsuran: 2_991_575, status: "Lancar", kualitas: 1, aktif: true },
];

/** Total monthly installment across all reported SLIK facilities. */
export const SLIK_TOTAL_ANGSURAN = SLIK_LOANS.reduce((sum, l) => sum + l.angsuran, 0);
