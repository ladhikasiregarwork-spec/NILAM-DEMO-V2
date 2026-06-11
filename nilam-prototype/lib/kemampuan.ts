import type { OcrResults } from "@/types/ocrExtract";

/** Monthly income components used for the payment-capacity formula. */
export interface IncomeParts {
  gajiBulanan: number;
  thrTahunan: number;
  bonusTahunan: number;
}

/** Derive gaji/THR/bonus from the bank-statement (mutasi) classification. */
export function incomePartsFromOcr(ocr: OcrResults): IncomeParts {
  const gajiBulanan =
    ocr.mutasi?.gajiNominal ?? ocr.slipGaji?.records?.find((r) => r.thp != null)?.thp ?? 0;
  return {
    gajiBulanan,
    thrTahunan: ocr.mutasi?.ringkasan?.THR ?? 0,
    bonusTahunan: ocr.mutasi?.ringkasan?.Bonus ?? 0,
  };
}

/**
 * Payment capacity = gaji/bulan + THR/12 + bonus/12 − angsuran SLIK.
 * (THR and bonus are annual amounts spread across the year.)
 */
export function kemampuanBayar(
  gajiBulanan: number,
  thrTahunan: number,
  bonusTahunan: number,
  slikAngsuran: number,
): number {
  return Math.round(gajiBulanan + thrTahunan / 12 + bonusTahunan / 12 - slikAngsuran);
}
