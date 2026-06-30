/**
 * Curated, offline vehicle catalog (simulates an "internet" vehicle search).
 *
 * Popular Indonesian models with indicative on-the-road (OTR Jakarta) prices,
 * used to drive the auto-loan (KKB) flow: type-ahead search → detail → loan
 * calculator. Prices are illustrative for the demo only.
 */
import type { Vehicle } from "@/types/auto";

export const VEHICLE_CATALOG: Vehicle[] = [
  {
    id: "avanza-15-g",
    brand: "Toyota", model: "Avanza", variant: "1.5 G CVT", fullName: "Toyota Avanza 1.5 G CVT",
    year: 2024, category: "MPV", price: 256_900_000, seats: 7, transmission: "CVT", fuel: "Bensin", engineCc: 1496,
    description:
      "MPV keluarga terlaris di Indonesia. Kabin 7 penumpang lega, irit bahan bakar, jaringan purna jual luas, dan biaya perawatan terjangkau — pilihan aman untuk mobilitas harian keluarga.",
    highlights: ["7 Penumpang", "Irit BBM", "Resale tinggi", "Fitur keselamatan lengkap"],
  },
  {
    id: "xenia-15-r",
    brand: "Daihatsu", model: "Xenia", variant: "1.5 R CVT", fullName: "Daihatsu Xenia 1.5 R CVT",
    year: 2024, category: "MPV", price: 248_000_000, seats: 7, transmission: "CVT", fuel: "Bensin", engineCc: 1496,
    description:
      "Kembaran Avanza dengan harga lebih bersahabat. MPV 7-seater tangguh untuk keluarga, kabin fleksibel, dan konsumsi BBM efisien untuk pemakaian kota maupun luar kota.",
    highlights: ["7 Penumpang", "Harga ekonomis", "Kabin fleksibel"],
  },
  {
    id: "brio-rs",
    brand: "Honda", model: "Brio", variant: "RS CVT", fullName: "Honda Brio RS CVT",
    year: 2024, category: "Hatchback", price: 233_300_000, seats: 5, transmission: "CVT", fuel: "Bensin", engineCc: 1199,
    description:
      "City car sporty dan lincah, favorit anak muda perkotaan. Mudah parkir, irit, dengan desain RS yang stylish dan kabin nyaman untuk 5 penumpang.",
    highlights: ["Lincah di kota", "Sangat irit", "Desain sporty"],
  },
  {
    id: "raize-10-gr",
    brand: "Toyota", model: "Raize", variant: "1.0 GR Sport", fullName: "Toyota Raize 1.0 GR Sport",
    year: 2024, category: "SUV", price: 280_500_000, seats: 5, transmission: "CVT", fuel: "Bensin", engineCc: 998,
    description:
      "Compact SUV bermesin turbo 1.0L yang bertenaga namun efisien. Ground clearance tinggi, fitur keselamatan Toyota Safety Sense, dan tampilan GR Sport yang agresif.",
    highlights: ["Mesin Turbo", "Ground clearance tinggi", "Safety Sense"],
  },
  {
    id: "hrv-se",
    brand: "Honda", model: "HR-V", variant: "1.5 SE CVT", fullName: "Honda HR-V 1.5 SE CVT",
    year: 2024, category: "SUV", price: 399_900_000, seats: 5, transmission: "CVT", fuel: "Bensin", engineCc: 1498,
    description:
      "SUV stylish dengan kabin premium dan teknologi Honda Sensing. Berkendara halus, bagasi luas, dan desain coupe-SUV yang elegan untuk gaya hidup urban modern.",
    highlights: ["Honda Sensing", "Kabin premium", "Desain elegan"],
  },
  {
    id: "xpander-ultimate",
    brand: "Mitsubishi", model: "Xpander", variant: "Ultimate AT", fullName: "Mitsubishi Xpander Ultimate AT",
    year: 2024, category: "MPV", price: 305_300_000, seats: 7, transmission: "Automatic", fuel: "Bensin", engineCc: 1499,
    description:
      "MPV modern dengan desain dynamic shield yang khas. Ground clearance tinggi, suspensi nyaman untuk jalan Indonesia, dan kabin lapang 7 penumpang.",
    highlights: ["7 Penumpang", "Suspensi nyaman", "Desain modern"],
  },
  {
    id: "innova-zenix-q-hybrid",
    brand: "Toyota", model: "Kijang Innova Zenix", variant: "Q Hybrid", fullName: "Toyota Kijang Innova Zenix Q Hybrid",
    year: 2024, category: "MPV", price: 470_000_000, seats: 7, transmission: "CVT", fuel: "Hybrid", engineCc: 1987,
    description:
      "MPV premium bertenaga hybrid yang senyap dan sangat irit. Kabin mewah berlapis kulit, fitur Toyota Safety Sense lengkap, ideal untuk keluarga dan eksekutif.",
    highlights: ["Hybrid hemat", "Kabin mewah", "Senyap"],
  },
  {
    id: "ertiga-gx",
    brand: "Suzuki", model: "Ertiga", variant: "GX AT", fullName: "Suzuki Ertiga GX AT",
    year: 2024, category: "MPV", price: 262_500_000, seats: 7, transmission: "Automatic", fuel: "Bensin", engineCc: 1462,
    description:
      "MPV 7-seater ringan dan irit dengan teknologi Smart Hybrid. Mudah dikendarai, perawatan murah, dan kabin yang fungsional untuk keluarga muda.",
    highlights: ["Smart Hybrid", "Ringan & irit", "Perawatan murah"],
  },
  {
    id: "sigra-12-r",
    brand: "Daihatsu", model: "Sigra", variant: "1.2 R AT", fullName: "Daihatsu Sigra 1.2 R AT",
    year: 2024, category: "LCGC", price: 175_000_000, seats: 7, transmission: "Automatic", fuel: "Bensin", engineCc: 1197,
    description:
      "LCGC 7-seater paling terjangkau. Pajak ringan, konsumsi BBM sangat irit, dan kapasitas keluarga — entry car ideal untuk pembeli mobil pertama.",
    highlights: ["Termurah", "Pajak ringan", "7 Penumpang"],
  },
  {
    id: "rush-s-gr",
    brand: "Toyota", model: "Rush", variant: "S GR Sport AT", fullName: "Toyota Rush S GR Sport AT",
    year: 2024, category: "SUV", price: 305_000_000, seats: 7, transmission: "Automatic", fuel: "Bensin", engineCc: 1496,
    description:
      "SUV 7-seater tangguh dengan ground clearance tinggi, cocok untuk jalan menantang. Tampilan GR Sport gagah dan kabin keluarga yang lapang.",
    highlights: ["7 Penumpang", "SUV tangguh", "Ground clearance tinggi"],
  },
  {
    id: "creta-prime",
    brand: "Hyundai", model: "Creta", variant: "Prime IVT", fullName: "Hyundai Creta Prime IVT",
    year: 2024, category: "SUV", price: 415_300_000, seats: 5, transmission: "Automatic", fuel: "Bensin", engineCc: 1497,
    description:
      "SUV bergaya Eropa dengan panoramic sunroof, layar sentuh besar, dan fitur ADAS Hyundai SmartSense. Berkendara nyaman dengan teknologi modern.",
    highlights: ["Panoramic sunroof", "SmartSense ADAS", "Layar besar"],
  },
  {
    id: "wuling-air-ev-lite",
    brand: "Wuling", model: "Air ev", variant: "Lite", fullName: "Wuling Air ev Lite",
    year: 2024, category: "EV", price: 206_000_000, seats: 4, transmission: "Automatic", fuel: "Listrik", engineCc: 0,
    description:
      "Mobil listrik mungil untuk perkotaan. Bebas pajak ganjil-genap, biaya 'isi daya' jauh lebih murah dari BBM, dan sangat mudah parkir di kota padat.",
    highlights: ["100% Listrik", "Biaya operasional rendah", "Bebas ganjil-genap"],
  },
  {
    id: "fortuner-vrz",
    brand: "Toyota", model: "Fortuner", variant: "2.4 VRZ AT 4x2", fullName: "Toyota Fortuner 2.4 VRZ AT",
    year: 2024, category: "SUV", price: 605_000_000, seats: 7, transmission: "Automatic", fuel: "Diesel", engineCc: 2393,
    description:
      "SUV ladder-frame premium bermesin diesel turbo bertenaga. Berwibawa, tangguh di segala medan, dengan kabin mewah 7 penumpang — pilihan eksekutif.",
    highlights: ["Diesel turbo", "Tangguh & berwibawa", "Kabin mewah"],
  },
  {
    id: "civic-rs",
    brand: "Honda", model: "Civic", variant: "RS Turbo", fullName: "Honda Civic RS Turbo",
    year: 2024, category: "Sedan", price: 631_000_000, seats: 5, transmission: "CVT", fuel: "Bensin", engineCc: 1498,
    description:
      "Sedan sport ikonik bermesin VTEC Turbo 1.5L. Handling presisi, desain low & wide yang agresif, dan kabin berteknologi Honda Sensing — sedan untuk penggemar berkendara.",
    highlights: ["VTEC Turbo", "Handling presisi", "Honda Sensing"],
  },
];

/**
 * Type-ahead search over the catalog. Matches brand / model / variant / category
 * tokens (case-insensitive). Empty query → a short "popular" shortlist.
 */
export function searchVehicles(query: string, limit = 8): Vehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) return VEHICLE_CATALOG.slice(0, 6);
  const tokens = q.split(/\s+/);
  return VEHICLE_CATALOG.filter((v) => {
    const hay = `${v.brand} ${v.model} ${v.variant} ${v.category} ${v.fuel}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  }).slice(0, limit);
}

/** A consistent accent color per body category (for the branded photo card). */
export const CATEGORY_COLOR: Record<string, string> = {
  MPV: "#00529C",
  SUV: "#0F766E",
  Hatchback: "#7C3AED",
  Sedan: "#B91C1C",
  LCGC: "#C2410C",
  EV: "#047857",
};
