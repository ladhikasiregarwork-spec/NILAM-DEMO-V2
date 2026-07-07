/**
 * Credit-card analytics — DUMMY / illustrative logic for the demo.
 *
 * Everything here is placeholder math so the analyst UI (maximum-limit
 * calculation, address hexagon, transaction-behaviour hexagon, 30-day
 * transaction averages) can be seen and tuned BEFORE any real backend exists.
 *
 * TODO(backend): replace computeCardMaxLimit / addressGeo /
 * txnBehaviorGeoService / MONTHLY_TXN with real service calls + models.
 */

import { BANK_STATEMENT_ROWS, bankRowTotal } from "@/data/bankStatementFixtures";

// ── deterministic pseudo-noise ────────────────────────────────────────────────
// A tiny string hash so dummy scores look "data-driven" (vary by input) yet stay
// stable across renders. Math.random() is intentionally avoided.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff; // 0..1
}
/** Deterministic 0..1 value for axis `i` of a seed string. */
function axisScore(seed: string, i: number, lo = 0.45, hi = 0.95): number {
  const v = hash(`${seed}#${i}`);
  return lo + v * (hi - lo);
}

// ── Maximum-limit calculation ─────────────────────────────────────────────────

export interface CardLimitInputs {
  /** Credit-scoring result 0..100. */
  applicationScore: number;
  /** Monthly income (THP / gaji), IDR. */
  monthlyIncome: number;
  /** Existing monthly obligations from SLIK (total angsuran aktif), IDR. */
  slikAngsuran: number;
  /** Avg monthly INCOMING (credit) transaction total over 30 days, IDR. */
  creditTxnAvg30d: number;
  /** Avg monthly OUTGOING (debit) transaction total over 30 days, IDR. */
  debitTxnAvg30d: number;
}

export interface LimitPart {
  label: string;
  value: number;
  /** "+" adds to the limit, "−" subtracts, "×" is a multiplier applied to the running base. */
  op: "+" | "−" | "×";
  note?: string;
}

export interface CardLimitBreakdown {
  inputs: CardLimitInputs;
  /** Base from income (≈ 3× monthly income). */
  incomeComponent: number;
  /** Positive net-cashflow contribution from transaction behaviour. */
  txnComponent: number;
  /** Score-driven multiplier (0.6 … 1.2). */
  scoreFactor: number;
  /** IDR reserved against existing SLIK obligations. */
  slikReserve: number;
  /** Final maximum limit (IDR, rounded to Rp1jt). */
  maxLimit: number;
  /** Ordered breakdown rows for display. */
  parts: LimitPart[];
}

const round1jt = (n: number) => Math.max(0, Math.round(n / 1_000_000) * 1_000_000);

/**
 * DUMMY maximum-limit model. Illustrative only:
 *   base      = income × 3
 *   txn       = max(0, creditAvg − debitAvg) × 2      (net-cashflow headroom)
 *   factor    = 0.6 + score/100 × 0.6                 (0.6 … 1.2)
 *   reserve   = slikAngsuran × 6                       (6 months of obligations)
 *   maxLimit  = (base + txn) × factor − reserve        (rounded to Rp1jt)
 */
export function computeCardMaxLimit(inp: CardLimitInputs): CardLimitBreakdown {
  const incomeComponent = inp.monthlyIncome * 3;
  const netCashflow = Math.max(0, inp.creditTxnAvg30d - inp.debitTxnAvg30d);
  const txnComponent = netCashflow * 2;
  const scoreFactor = 0.6 + (Math.max(0, Math.min(100, inp.applicationScore)) / 100) * 0.6;
  const slikReserve = inp.slikAngsuran * 6;
  const maxLimit = round1jt((incomeComponent + txnComponent) * scoreFactor - slikReserve);

  return {
    inputs: inp,
    incomeComponent,
    txnComponent,
    scoreFactor,
    slikReserve,
    maxLimit,
    parts: [
      { label: "Basis Penghasilan", value: incomeComponent, op: "+", note: "3 × gaji/bln" },
      { label: "Perilaku Transaksi", value: txnComponent, op: "+", note: "net cashflow × 2" },
      { label: "Faktor Skor Aplikasi", value: scoreFactor, op: "×", note: `skor ${Math.round(inp.applicationScore)}` },
      { label: "Cadangan SLIK", value: slikReserve, op: "−", note: "6 × angsuran aktif" },
    ],
  };
}

/** Granted limit = grantedPct × maxLimit, rounded to Rp1jt. Default pct 0.80. */
export function grantedFromMax(maxLimit: number, grantedPct: number): number {
  return round1jt(maxLimit * grantedPct);
}

// ── Geospatial hex cell (lat/long) ────────────────────────────────────────────
// A geographic point plus the radius of the hexagonal cell drawn around it
// (H3-style). NOT a radar/aspect chart — the hexagon represents an AREA on the
// map centred on the coordinate.

export interface GeoPoint {
  lat: number;
  lon: number;
  /** Human-readable area label (dummy). */
  area: string;
  /** Radius of the hex cell around the coordinate, in km (dummy). */
  radiusKm: number;
}

const AREAS = ["Jakarta Selatan", "Jakarta Pusat", "Tangerang Selatan", "Bekasi", "Depok", "Bogor"];
const pickArea = (seed: string) => AREAS[Math.floor(hash(`${seed}:area`) * AREAS.length) % AREAS.length];

/** DUMMY geocode of the applicant's ADDRESS → lat/long + hex-cell radius. */
export function addressGeo(address?: string): GeoPoint {
  const seed = (address && address.trim()) || "alamat-default";
  return {
    lat: -6.2088 + (hash(`${seed}:lat`) - 0.5) * 0.2,
    lon: 106.8456 + (hash(`${seed}:lon`) - 0.5) * 0.2,
    area: pickArea(seed),
    radiusKm: 0.8 + hash(`${seed}:r`) * 1.4, // 0.8 … 2.2 km
  };
}

/**
 * DUMMY "transaction-behaviour geo service". In production this would call an
 * external service returning the applicant's dominant transaction location
 * (lat/long). Here it fabricates a stable point from the NIK so the UI can draw
 * the hex cell around the coordinate.
 */
export function txnBehaviorGeoService(nik?: string): GeoPoint {
  const seed = (nik && nik.trim()) || "0000000000000000";
  return {
    lat: -6.2088 + (hash(`${seed}:lat`) - 0.5) * 0.18,
    lon: 106.8456 + (hash(`${seed}:lon`) - 0.5) * 0.18,
    area: pickArea(seed),
    radiusKm: 1.0 + hash(`${seed}:r`) * 2.0, // 1.0 … 3.0 km
  };
}

// ── Monthly transaction aggregates (Detail Transaksi) ─────────────────────────
// Aggregated per calendar month: balance by AVERAGE saldo, credit & debit by
// SUM and COUNT. Credit sums come from the bank-statement fixture; debit, counts
// and balance are deterministic dummy placeholders.

export interface MonthlyTxn {
  /** Short month label, e.g. "Apr". */
  month: string;
  /** Total credit (incoming) for the month, IDR (sum). */
  creditSum: number;
  /** Number of credit transactions in the month (count). */
  creditCount: number;
  /** Total debit (outgoing) for the month, IDR (sum). */
  debitSum: number;
  /** Number of debit transactions in the month (count). */
  debitCount: number;
  /** Average account balance (saldo) across the month, IDR (average). */
  avgBalance: number;
}

const OPENING_BALANCE = 8_500_000;

/** DUMMY monthly aggregates, 12 months (Apr 2025 – Mar 2026). */
export const MONTHLY_TXN: MonthlyTxn[] = (() => {
  let bal = OPENING_BALANCE;
  return BANK_STATEMENT_ROWS.map((row, i) => {
    const creditSum = bankRowTotal(row);
    const creditCount = 1 + Math.round(axisScore(`cc#${i}`, i, 0, 1) * 3); // 1..4
    const debitSum = Math.round(creditSum * (0.45 + axisScore(`ds#${i}`, i, 0, 1) * 0.35)); // 45–80% of credit
    const debitCount = 16 + Math.round(axisScore(`dc#${i}`, i, 0, 1) * 22); // 16..38
    const start = bal;
    bal += creditSum - debitSum;
    const avgBalance = Math.round((start + bal) / 2);
    return { month: row.month.split(" ")[0], creditSum, creditCount, debitSum, debitCount, avgBalance };
  });
})();

/** Roll-ups across the 12 months (summary tiles + max-limit inputs). */
export interface MonthlyTxnSummary {
  creditTotal: number;
  debitTotal: number;
  creditCount: number;
  debitCount: number;
  avgBalance: number;
  avgMonthlyCredit: number;
  avgMonthlyDebit: number;
}

export const MONTHLY_SUMMARY: MonthlyTxnSummary = (() => {
  const n = MONTHLY_TXN.length || 1;
  const creditTotal = MONTHLY_TXN.reduce((s, m) => s + m.creditSum, 0);
  const debitTotal = MONTHLY_TXN.reduce((s, m) => s + m.debitSum, 0);
  return {
    creditTotal,
    debitTotal,
    creditCount: MONTHLY_TXN.reduce((s, m) => s + m.creditCount, 0),
    debitCount: MONTHLY_TXN.reduce((s, m) => s + m.debitCount, 0),
    avgBalance: Math.round(MONTHLY_TXN.reduce((s, m) => s + m.avgBalance, 0) / n),
    avgMonthlyCredit: Math.round(creditTotal / n),
    avgMonthlyDebit: Math.round(debitTotal / n),
  };
})();
