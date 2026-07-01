/**
 * One-click DEMO seed for the customer flow.
 *
 * The upload step normally needs the local classifier/OCR service (port 8020)
 * to read uploaded documents. When that backend is not running (e.g. a pure
 * front-end demo), there is no way to get past the upload gate. This module
 * provides ready-made OCR/SLIK/agunan fixtures so the flow can be filled with
 * one click — or automatically when the classifier is unreachable.
 *
 * Values are kept consistent with the rest of the demo (Rangga Saputra,
 * PT Sinar Mandiri Sejahtera, gaji pokok 10jt — see data/profileFixtures.ts,
 * data/incomeFixtures.ts, data/slikLoansFixtures.ts).
 *
 * Gated behind DEMO_CONTROLS at the call sites — never ships in production.
 */
import type {
  KtpExtract,
  KkExtract,
  SlipGajiExtract,
  MutasiExtract,
  SkPerusahaanExtract,
} from "@/types/ocrExtract";
import type { SlikReport } from "@/types/profile";
import type { AgunanData } from "@/types/agunan";
import type { DocumentId } from "@/types/documents";

const NIK_NASABAH = "3271234567890002";
const NAMA_NASABAH = "Rangga Saputra";
const ALAMAT = "Jl. Melati No. 12, RT 003/RW 004, Cilandak, Jakarta Selatan";

export const DEMO_KTP: KtpExtract = {
  nik: NIK_NASABAH,
  nama: NAMA_NASABAH,
  gender: "Laki-laki",
  tempatLahir: "Jakarta",
  tanggalLahir: "08/11/1988",
  alamat: ALAMAT,
  statusPerkawinan: "Kawin",
  fileName: "ktp_demo.jpg",
};

export const DEMO_KK: KkExtract = {
  nomorKK: "3271080512080003",
  kepalaKeluarga: NAMA_NASABAH,
  alamat: ALAMAT,
  members: [
    { nama: NAMA_NASABAH, hubungan: "Kepala Keluarga", nik: NIK_NASABAH },
    { nama: "Siti Nurhaliza", hubungan: "Istri", nik: "3271234567890001" },
    { nama: "Bima Saputra", hubungan: "Anak", nik: "3271234567890010" },
  ],
  fileName: "kk_demo.jpg",
};

export const DEMO_SLIP_GAJI: SlipGajiExtract = {
  records: ["2026-01", "2026-02", "2026-03"].map((tgl) => ({
    tanggalPembayaran: tgl + "-25",
    gajiPokok: 10_000_000,
    tunjangan: 2_500_000,
    totalUpah: 12_500_000,
    totalPotongan: 1_500_000,
    thp: 11_000_000,
    thr: 0,
    bonus: 0,
    fileName: `slip_${tgl}.pdf`,
  })),
};

export const DEMO_MUTASI: MutasiExtract = {
  noRekening: "0123-01-001234-50-1",
  count: 9,
  totalKredit: 206_000_000,
  totalDebet: 151_000_000,
  gajiNominal: 10_000_000,
  ringkasan: { Gaji: 120_000_000, THR: 20_000_000, Bonus: 60_000_000, Tunjangan: 6_000_000 },
  transactions: [
    { tanggal: "2026-03-25", remark: "GAJI MARET 2026 - PT SINAR MANDIRI",     nominal: 10_000_000, dk: "Kredit", klasifikasi: "Gaji" },
    { tanggal: "2026-03-10", remark: "TUNJANGAN TRANSPORT Q1",                  nominal: 1_000_000,  dk: "Kredit", klasifikasi: "Tunjangan" },
    { tanggal: "2026-02-25", remark: "GAJI FEBRUARI 2026 - PT SINAR MANDIRI",   nominal: 10_000_000, dk: "Kredit", klasifikasi: "Gaji" },
    { tanggal: "2026-02-14", remark: "BONUS KINERJA 2025",                      nominal: 30_000_000, dk: "Kredit", klasifikasi: "Bonus" },
    { tanggal: "2026-01-25", remark: "GAJI JANUARI 2026 - PT SINAR MANDIRI",    nominal: 10_000_000, dk: "Kredit", klasifikasi: "Gaji" },
    { tanggal: "2026-01-05", remark: "ANGSURAN KPR BRI",                        nominal: 2_500_000,  dk: "Debit",  klasifikasi: "Angsuran" },
    { tanggal: "2025-12-20", remark: "THR / TUNJANGAN HARI RAYA",               nominal: 20_000_000, dk: "Kredit", klasifikasi: "THR" },
    { tanggal: "2025-12-20", remark: "BONUS AKHIR TAHUN",                       nominal: 30_000_000, dk: "Kredit", klasifikasi: "Bonus" },
    { tanggal: "2025-12-25", remark: "GAJI DESEMBER 2025 - PT SINAR MANDIRI",   nominal: 10_000_000, dk: "Kredit", klasifikasi: "Gaji" },
  ],
  fileName: ["mutasi_2025-2026.pdf"],
};

export const DEMO_SK: SkPerusahaanExtract = {
  perusahaan: "PT Sinar Mandiri Sejahtera",
  jabatan: "Senior Supervisor Produksi",
  statusKepegawaian: "Karyawan Tetap",
  masaKerja: "5 tahun 3 bulan",
  tanggalMulai: "01/02/2021",
  tanggalBerakhir: "Tetap",
  namaPekerja: NAMA_NASABAH,
  nik: NIK_NASABAH,
  nomorSurat: "SK/HRD/2026/0142",
  tanggalSurat: "10/01/2026",
  fileName: "sk_perusahaan_demo.pdf",
};

export const DEMO_SLIK: SlikReport = {
  nik: NIK_NASABAH,
  namaDebitur: NAMA_NASABAH,
  loans: [
    { jenis: "Kartu Kredit", lembaga: "Bank Central Asia",    plafon: 6_000_000,   baki: 0,           angsuran: 0,         status: "Lunas",  kualitas: 1, sukuBunga: 21.0, tanggalMulai: "20230510", tanggalJatuhTempo: "20270430", aktif: false },
    { jenis: "Multiguna",    lembaga: "Bank Rakyat Indonesia", plafon: 259_000_000, baki: 235_880_725, angsuran: 2_991_575, status: "Lancar", kualitas: 1, sukuBunga: 8.25, tanggalMulai: "20241003", tanggalJatuhTempo: "20351003", aktif: true },
  ],
  totalAngsuran: 2_991_575,
  kolekTerburuk: 1,
  totalFasilitas: 2,
};

/** Collateral under the Rp500jt survey threshold → flow goes straight to offer. */
export const DEMO_AGUNAN: AgunanData = {
  luasBangunan: 45,
  luasTanah: 72,
  provinsi: "Jawa Barat",
  kota: "Bekasi",
  kecamatan: "Bekasi Utara",
  kelurahan: "Harapan Baru",
  kodepos: "17123",
  harga: 480_000_000,
  sumber: "manual",
};

/** File counts per document type (drives the "X file" chips + uploaded checks). */
export const DEMO_DOC_COUNTS: Partial<Record<DocumentId, number>> = {
  ktp: 1,
  kk: 1,
  slip_gaji: 3,
  mutasi: 12,
  sk_perusahaan: 1,
};
