/**
 * Masa kerja (employment tenure) derived from the join date so it can never
 * disagree with the `tanggalMulai` shown next to it.
 *
 * The join date reaches us in several shapes depending on the source:
 *   - the SK OCR extractor returns Indonesian long form, e.g. "1 Januari 2025"
 *   - fixtures/manual entry use numeric "01/02/2021" (also "-" or "." separators)
 * so the parser below accepts all of them (numeric month, Indonesian or English
 * month names, 2- or 4-digit year).
 */

/** Month-name → 1-based month index (Indonesian + common abbreviations + English). */
const MONTHS: Record<string, number> = {
  januari: 1, jan: 1, january: 1,
  februari: 2, feb: 2, februar: 2, february: 2,
  maret: 3, mar: 3, march: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6, june: 6,
  juli: 7, jul: 7, july: 7,
  agustus: 8, agu: 8, agt: 8, ags: 8, aug: 8, august: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10, october: 10,
  november: 11, nov: 11, nopember: 11,
  desember: 12, des: 12, dec: 12, december: 12,
};

/** Normalize a 2- or 4-digit year to a full year (2-digit → 2000s). */
function fullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

/**
 * Parse a join/start date in numeric ("DD/MM/YYYY", "DD-MM-YY", "DD.MM.YYYY") or
 * word form ("1 Januari 2025", "01 Jan 25") into a Date. Returns undefined for
 * anything unrecognized (e.g. "Tetap").
 */
export function parseTanggalMulai(s?: string): Date | undefined {
  if (!s) return undefined;
  const str = s.trim();

  // Numeric: DD sep MM sep YY(YY)
  const num = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (num) {
    const date = new Date(fullYear(Number(num[3])), Number(num[2]) - 1, Number(num[1]));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  // Word form: DD MonthName YY(YY)
  const word = str.match(/(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{2,4})/);
  if (word) {
    const month = MONTHS[word[2].toLowerCase()];
    if (!month) return undefined;
    const date = new Date(fullYear(Number(word[3])), month - 1, Number(word[1]));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

/**
 * Tenure (years + months) between the join date `start` and `now`. Counts whole
 * months, dropping the trailing partial month like age is counted in usia.ts.
 */
export function hitungMasaKerja(
  start?: Date,
  now: Date = new Date(),
): { tahun: number; bulan: number } | undefined {
  if (!start) return undefined;
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return undefined;
  return { tahun: Math.floor(months / 12), bulan: months % 12 };
}

/**
 * Masa kerja as an Indonesian display string derived from the join date
 * (`tanggalMulai`), e.g. "1 tahun 6 bulan". This is the single source of truth
 * for tenure so it can never disagree with the join date shown next to it.
 * Returns undefined when the date can't be parsed (caller falls back to any
 * stored string).
 */
export function masaKerjaFromTanggalMulai(
  tanggalMulai?: string,
  now: Date = new Date(),
): string | undefined {
  const mk = hitungMasaKerja(parseTanggalMulai(tanggalMulai), now);
  if (!mk) return undefined;
  if (mk.tahun > 0 && mk.bulan > 0) return `${mk.tahun} tahun ${mk.bulan} bulan`;
  if (mk.tahun > 0) return `${mk.tahun} tahun`;
  return `${mk.bulan} bulan`;
}
