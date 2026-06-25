import type { CustomerProfile, EmploymentAgreement } from "@/types/profile";

/**
 * Mock customer profile + employment agreement.
 *
 * ── FUTURE API SWAP ───────────────────────────────────────────────────────
 * This file is the single source of truth for the customer dossier. When you
 * move to a real backend, replace the constants below with the API response
 * (or export an async loader from here). The dashboard cards import these names
 * and never touch the network, so nothing else has to change.
 *
 * Values are kept consistent with the rest of the demo:
 *   - nama matches data/incomeFixtures.ts (NASABAH_INCOME.name = "Rangga Saputra")
 *   - perusahaan/jabatan/gajiPokok match the employment agreement below
 *   - gajiPokok (10jt) matches data/ocrFixtures.ts (SLIP_GAJI.Gaji)
 */

export const CUSTOMER_PROFILE: CustomerProfile = {
  nik: "3271234567890002",
  nama: "Rangga Saputra",
  gender: "Laki-laki",
  tanggalLahir: "08/11/1988",
  perusahaan: "PT Sinar Mandiri Sejahtera",
  jabatan: "Officer",
};

export const EMPLOYMENT_AGREEMENT: EmploymentAgreement = {
  perusahaan: "PT Sinar Mandiri Sejahtera",
  jabatan: "Officer",
  statusKepegawaian: "Karyawan Tetap",
  masaKerja: "5 tahun 3 bulan",
  gajiPokok: 10_000_000,
  tanggalMulai: "01/02/2021",
  tanggalBerakhir: "Tetap",
};
