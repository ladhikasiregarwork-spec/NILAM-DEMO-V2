import type { OcrSlipResult, OcrMutasiResult, IdentityResult } from "@/types/engines";

export const SLIP_GAJI: OcrSlipResult = { Gaji: 10_000_000 };
export const MUTASI: OcrMutasiResult = {
  Gaji:    { count: 12, sum: 120_000_000, min: 10_000_000 },
  THR:     { count: 1,  sum: 20_000_000,  min: 20_000_000 },
  Bonus:   { count: 2,  sum: 60_000_000,  min: 10_000_000 },
  Insentif:{ count: 6,  sum: 6_000_000,   min: 1_000_000  },
};

export const IDENTITY_PASANGAN: IdentityResult = {
  NIK: "3271234567890001",
  Nama: "SITI NURHALIZA",
  Gender: "Perempuan",
  TanggalLahir: "12/05/1990",
};

// ---------------------------------------------------------------------------
// Monthly document coverage (one file per month in the field).
//   - Slip Gaji  : 3 bulan terakhir — shown as extracted, NO gap analysis.
//   - Mutasi Rek.: minimal 12 bulan terakhir — gap analysis applies here only.
//
// FULL = every month present. GAP = Nov 2025 missing inside the 12-month span,
// used by the OCR PROCESSING demo toggle to showcase mutasi gap detection.
// ---------------------------------------------------------------------------

/** Slip Gaji — Jan–Mar 2026 (always complete; no gap detection). */
export const SLIP_MONTHS_FULL = ["2026-01", "2026-02", "2026-03"];

/** Mutasi must cover at least the last 12 months. */
export const MUTASI_MIN_MONTHS = 12;

/** Mutasi Rekening — Apr 2025 … Mar 2026 (12 consecutive months). */
export const MUTASI_MONTHS_FULL = [
  "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09",
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
];
/** Mutasi Rekening with Nov 2025 missing (interior gap, 11/12 detected). */
export const MUTASI_MONTHS_GAP = MUTASI_MONTHS_FULL.filter((k) => k !== "2025-11");
