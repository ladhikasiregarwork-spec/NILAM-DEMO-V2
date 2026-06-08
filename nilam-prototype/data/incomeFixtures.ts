import type { CustomerIncome } from "@/types/income";
import { SLIK_NASABAH, SLIK_PASANGAN } from "./slikFixtures";

// Default weights/modes chosen to reproduce the reference's displayed adjusted values & THP.
// THP Nasabah  = (10M*0.5) + (20M*0.5) + (30M*0.3) + (1M*0.5) − 3.5M
//              = 5M + 10M + 9M + 0.5M − 3.5M = 21M
// THP Pasangan = (8M*0.5) + (16M*0.5) + (20M*0.5) + (0.8M*0.5) − 4.9M
//              = 4M + 8M + 10M + 0.4M − 4.9M = 17.5M
// Total        = 21M + 17.5M = 38.5M
export const NASABAH_INCOME: CustomerIncome = {
  role: "nasabah",
  name: "Rangga Saputra",
  angsuran: SLIK_NASABAH.angsuranBulanan,
  components: [
    { key: "Gaji",     avg: 10_000_000, min: 10_000_000, mode: "avg", weight: 0.5 },
    { key: "THR",      avg: 20_000_000, min: 20_000_000, mode: "avg", weight: 0.5 },
    { key: "Bonus",    avg: 30_000_000, min: 10_000_000, mode: "avg", weight: 0.3 },
    { key: "Insentif", avg: 1_000_000,  min: 1_000_000,  mode: "avg", weight: 0.5 },
  ],
};

export const PASANGAN_INCOME: CustomerIncome = {
  role: "pasangan",
  name: "Siti Nurhaliza",
  angsuran: SLIK_PASANGAN.angsuranBulanan,
  components: [
    { key: "Gaji",     avg: 8_000_000,  min: 8_000_000,  mode: "avg", weight: 0.5 },
    { key: "THR",      avg: 16_000_000, min: 16_000_000, mode: "avg", weight: 0.5 },
    { key: "Bonus",    avg: 20_000_000, min: 20_000_000, mode: "avg", weight: 0.5 },
    { key: "Insentif", avg: 800_000,    min: 800_000,    mode: "avg", weight: 0.5 },
  ],
};
