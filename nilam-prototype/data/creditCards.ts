/**
 * BRI credit-card catalog for the demo — two products the customer chooses
 * between on the card_select step. Limits, fees, and benefits are illustrative
 * (not an official product sheet).
 */
import type { CreditCard, CreditCardType } from "@/types/card";

export const CREDIT_CARDS: CreditCard[] = [
  {
    id: "easy",
    name: "BRI Easy Card",
    tagline: "Kartu kredit ringan untuk kebutuhan harian",
    network: "Mastercard",
    minLimit: 3_000_000,
    maxLimit: 20_000_000,
    defaultLimit: 8_000_000,
    annualFee: 0,
    annualFeeNote: "Gratis iuran tahunan",
    interestMonthly: 0.0175,
    minIncomeMonthly: 3_000_000,
    benefits: [
      "Cicilan 0% hingga 12 bulan di merchant pilihan",
      "Cashback 1% untuk transaksi groceries & tagihan",
      "Bebas iuran tahunan selamanya",
      "Notifikasi & kontrol kartu penuh via BRImo",
    ],
    highlights: ["Iuran gratis", "Cicilan 0%", "Cashback 1%"],
    gradient: "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)",
    image: "/cards/bri-easy.png",
  },
  {
    id: "touch",
    name: "BRI Touch Card",
    tagline: "Kartu premium untuk gaya hidup aktif",
    network: "Visa",
    minLimit: 5_000_000,
    maxLimit: 50_000_000,
    defaultLimit: 25_000_000,
    annualFee: 125_000,
    annualFeeNote: "Gratis tahun pertama",
    interestMonthly: 0.0175,
    minIncomeMonthly: 5_000_000,
    benefits: [
      "Akses airport lounge domestik 4×/tahun",
      "Cashback 1% & reward point berlipat di dining/travel",
      "Teknologi contactless & tokenisasi digital",
      "Proteksi transaksi & asuransi perjalanan",
    ],
    highlights: ["Airport lounge", "Contactless", "Reward berlipat"],
    gradient: "linear-gradient(135deg, #0B1E3B 0%, #00305C 55%, #00529C 100%)",
    image: "/cards/bri-touch.png",
  },
];

export function cardById(id?: CreditCardType | null): CreditCard | undefined {
  return CREDIT_CARDS.find((c) => c.id === id);
}
