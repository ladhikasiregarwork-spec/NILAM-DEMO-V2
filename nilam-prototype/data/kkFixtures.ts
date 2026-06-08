import type { KartuKeluarga } from "@/types/profile";

/**
 * Mock family card (Kartu Keluarga) data.
 *
 * ── FUTURE API SWAP ───────────────────────────────────────────────────────
 * Replace this constant with the KK endpoint's response (same shape). Values
 * are kept consistent with the rest of the demo (head of family matches the
 * customer profile name "Rangga Saputra").
 */
export const KK_INFO: KartuKeluarga = {
  nomorKK: "3271010101010001",
  kepalaKeluarga: "Rangga Saputra",
  alamat: "Jl. Melati No. 12, RT 003/RW 004, Bandung",
  members: [
    { nama: "Rangga Saputra", hubungan: "Kepala Keluarga" },
    { nama: "Dewi Lestari",   hubungan: "Istri" },
    { nama: "Bima Saputra",   hubungan: "Anak" },
  ],
};
