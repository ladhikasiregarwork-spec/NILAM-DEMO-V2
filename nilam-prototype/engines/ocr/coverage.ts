/**
 * OCR month-coverage engine (pure).
 *
 * Real-world income documents arrive one file per month: a customer may upload
 * 3 monthly slip gaji and up to 12 monthly mutasi files. This engine turns the
 * set of detected months into a structured coverage report so the dashboard can
 * render a per-month checklist and flag any missing months (gaps).
 */

/** Indonesian short month names, index 0 = Januari. */
const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

export interface CoverageMonth {
  /** Sortable "YYYY-MM" key (MM is 01-12). */
  key: string;
  /** Short month label, e.g. "Nov". */
  short: string;
  /** Full label, e.g. "Nov 2025". */
  label: string;
}

/** Build a CoverageMonth from a zero-based absolute month index (year*12 + month0). */
function monthFromIndex(idx: number): CoverageMonth {
  const year = Math.floor(idx / 12);
  const month0 = idx % 12;
  const short = ID_MONTHS[month0];
  const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  return { key, short, label: `${short} ${year}` };
}

/** Parse a "YYYY-MM" key into a zero-based absolute month index. */
function indexFromKey(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Convert a "YYYY-MM" key to a {@link CoverageMonth}. */
export function monthFromKey(key: string): CoverageMonth {
  return monthFromIndex(indexFromKey(key));
}

/** `count` consecutive months ending at `endKey` (inclusive), ascending order. */
export function monthRange(endKey: string, count: number): CoverageMonth[] {
  const end = indexFromKey(endKey);
  const out: CoverageMonth[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(monthFromIndex(end - i));
  return out;
}

/** Every consecutive month from `startKey` to `endKey`, inclusive, ascending. */
export function monthRangeBetween(startKey: string, endKey: string): CoverageMonth[] {
  const count = indexFromKey(endKey) - indexFromKey(startKey) + 1;
  return count > 0 ? monthRange(endKey, count) : [];
}

export interface CoverageResult {
  /** The contiguous span from the earliest to the latest detected month. */
  expected: CoverageMonth[];
  /** Months actually detected, ascending. */
  detected: CoverageMonth[];
  /** Months missing INSIDE the detected span, ascending (the interior gaps). */
  missing: CoverageMonth[];
  /** True when there is no interior gap in the detected span. */
  isComplete: boolean;
  /** True when the covered period (span length) is ≥ minMonths. */
  meetsMinimum: boolean;
  /** "Apr 2025 – Mar 2026" across the detected span ("" when none). */
  rangeLabel: string;
}

/**
 * Analyse OCR month coverage by examining the customer's UPLOADED span.
 *
 * The expected window is the contiguous range from the earliest to the latest
 * detected month — so a customer may provide anywhere from `minMonths` up to
 * a full year. Any month missing strictly BETWEEN the first and last uploaded
 * month is reported as an interior gap (e.g. upload Apr 2025–Mar 2026 with
 * Nov 2025 absent → Nov flagged). `meetsMinimum` separately reports whether
 * enough months were supplied.
 */
export function analyzeOcrCoverage(
  detectedKeys: string[],
  minMonths = 0
): CoverageResult {
  const detected = [...detectedKeys].sort().map(monthFromKey);

  if (detected.length === 0) {
    return {
      expected: [],
      detected: [],
      missing: [],
      isComplete: true,
      meetsMinimum: minMonths === 0,
      rangeLabel: "",
    };
  }

  const span = monthRangeBetween(detected[0].key, detected[detected.length - 1].key);
  const detectedSet = new Set(detected.map((m) => m.key));
  const missing = span.filter((m) => !detectedSet.has(m.key));

  return {
    expected: span,
    detected,
    missing,
    isComplete: missing.length === 0,
    meetsMinimum: span.length >= minMonths,
    rangeLabel: `${span[0].label} – ${span[span.length - 1].label}`,
  };
}
