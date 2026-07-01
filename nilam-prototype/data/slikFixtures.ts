import type { SlikResult } from "@/types/engines";

/**
 * Demo SLIK fixtures (shown when the live SLIK service has no data for the NIK).
 *
 * Every field is overridable from `nilam-prototype/.env` via NEXT_PUBLIC_SLIK_*
 * — the values below are the defaults used when a var is unset. NEXT_PUBLIC_ is
 * required so the value is inlined into the browser bundle; changing .env needs
 * a dev-server restart. (This is the Next.js .env, separate from the repo-root
 * .env that configures the Python services.)
 */
const numEnv = (raw: string | undefined, fallback: number): number => {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : fallback;
};

export const SLIK_NASABAH: SlikResult = {
  outstanding: numEnv(process.env.NEXT_PUBLIC_SLIK_OUTSTANDING_NASABAH, 235_880_725),
  angsuranBulanan: numEnv(process.env.NEXT_PUBLIC_SLIK_ANGSURAN_NASABAH, 2_991_575),
  tunggakan: numEnv(process.env.NEXT_PUBLIC_SLIK_TUNGGAKAN_NASABAH, 0),
  status: process.env.NEXT_PUBLIC_SLIK_STATUS_NASABAH || "Lancar",
  score: numEnv(process.env.NEXT_PUBLIC_SLIK_SCORE_NASABAH, 760),
};

export const SLIK_PASANGAN: SlikResult = {
  outstanding: numEnv(process.env.NEXT_PUBLIC_SLIK_OUTSTANDING_PASANGAN, 80_000_000),
  angsuranBulanan: numEnv(process.env.NEXT_PUBLIC_SLIK_ANGSURAN_PASANGAN, 4_900_000),
  tunggakan: numEnv(process.env.NEXT_PUBLIC_SLIK_TUNGGAKAN_PASANGAN, 0),
  status: process.env.NEXT_PUBLIC_SLIK_STATUS_PASANGAN || "Lancar",
  score: numEnv(process.env.NEXT_PUBLIC_SLIK_SCORE_PASANGAN, 710),
};
