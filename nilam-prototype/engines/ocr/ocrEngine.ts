import type { OcrSlipResult, OcrMutasiResult, IdentityResult } from "@/types/engines";
export const readSlip = (slip: OcrSlipResult): OcrSlipResult => slip;
export const readMutasi = (m: OcrMutasiResult): OcrMutasiResult => m;
export const readKtp = (k: IdentityResult): IdentityResult => k;
