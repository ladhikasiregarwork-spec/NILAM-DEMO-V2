/**
 * BRI KKB (Kredit Kendaraan Bermotor) indicative rate schemes for the auto-loan
 * calculator. `rate` is the effective annual rate used for the annuity estimate.
 * Illustrative for the demo — not an official rate sheet.
 */
export interface AutoScheme {
  id: string;
  label: string;
  rateLabel: string;
  /** Effective rate p.a. used for the installment estimate. */
  rate: number;
  /** Allowed tenor range in months. */
  minTenorM: number;
  maxTenorM: number;
  note: string;
}

export const AUTO_SCHEMES: AutoScheme[] = [
  { id: "promo", label: "Promo Tenor Pendek", rateLabel: "3,88%", rate: 0.0388, minTenorM: 12, maxTenorM: 24, note: "Bunga promo untuk tenor s.d. 2 tahun" },
  { id: "reguler3", label: "Reguler 3 Tahun", rateLabel: "5,25%", rate: 0.0525, minTenorM: 12, maxTenorM: 36, note: "Bunga reguler untuk tenor s.d. 3 tahun" },
  { id: "reguler5", label: "Reguler s.d. 5 Tahun", rateLabel: "6,75%", rate: 0.0675, minTenorM: 12, maxTenorM: 60, note: "Bunga reguler untuk tenor s.d. 5 tahun" },
];

/** Tenor options (months) offered in the calculator. */
export const TENOR_OPTIONS_M = [12, 24, 36, 48, 60];

/** Minimum / default / maximum down-payment fraction for a new car. */
export const MIN_DP_PCT = 0.2;
export const DEFAULT_DP_PCT = 0.25;
export const MAX_DP_PCT = 0.9;

export function schemeById(id: string): AutoScheme {
  return AUTO_SCHEMES.find((s) => s.id === id) ?? AUTO_SCHEMES[2];
}

/** Pick the cheapest scheme whose tenor range covers `tenorMonths`. */
export function bestSchemeForTenor(tenorMonths: number): AutoScheme {
  const eligible = AUTO_SCHEMES.filter((s) => tenorMonths >= s.minTenorM && tenorMonths <= s.maxTenorM);
  if (!eligible.length) return AUTO_SCHEMES[2];
  return eligible.reduce((best, s) => (s.rate < best.rate ? s : best));
}
