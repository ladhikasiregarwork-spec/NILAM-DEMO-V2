export interface OcrSlipResult { Gaji: number }
export interface OcrBucket { count: number; sum: number; min: number }
export interface OcrMutasiResult {
  Gaji: OcrBucket; THR: OcrBucket; Bonus: OcrBucket; Insentif: OcrBucket;
}

export interface SlikResult {
  outstanding: number;        // outstanding kredit
  angsuranBulanan: number;    // monthly installment → feeds income card Angsuran
  tunggakan: number;          // arrears
  status: string;             // e.g. "Lancar"
  score: number;              // credit score
}

export interface FraudCheck { name: string; score: number }   // score 0..1
export interface FraudResult { checks: FraudCheck[]; overall: number }  // overall 0..1

export interface IdentityResult {
  NIK: string; Nama: string; Gender: string; TanggalLahir: string;
}
