/**
 * Curated (offline) directory of BRI Relationship Managers for the KKB flow.
 * Each RM is anchored to a branch location (lat/lon) so an application can be
 * auto-mapped to the nearest RM when the customer doesn't request one by name.
 * Illustrative demo data — not real staff or branches.
 */
export interface RelationshipManager {
  id: string;
  name: string;
  /** Unit kerja / cabang. */
  branch: string;
  city: string;
  lat: number;
  lon: number;
}

export const RELATIONSHIP_MANAGERS: RelationshipManager[] = [
  { id: "rm-jkt", name: "Andi Pratama", branch: "KC Jakarta Sudirman", city: "Jakarta", lat: -6.2146, lon: 106.8451 },
  { id: "rm-bdg", name: "Siti Nurhaliza", branch: "KC Bandung Asia Afrika", city: "Bandung", lat: -6.9215, lon: 107.6098 },
  { id: "rm-sby", name: "Budi Santoso", branch: "KC Surabaya Pahlawan", city: "Surabaya", lat: -7.2459, lon: 112.7378 },
  { id: "rm-smg", name: "Dewi Lestari", branch: "KC Semarang Pemuda", city: "Semarang", lat: -6.9869, lon: 110.4209 },
  { id: "rm-yog", name: "Rizky Maulana", branch: "KC Yogyakarta Malioboro", city: "Yogyakarta", lat: -7.7929, lon: 110.3656 },
  { id: "rm-mdn", name: "Putri Anggraini", branch: "KC Medan Balai Kota", city: "Medan", lat: 3.5897, lon: 98.6738 },
  { id: "rm-mks", name: "Fajar Ramadhan", branch: "KC Makassar Sam Ratulangi", city: "Makassar", lat: -5.1486, lon: 119.4327 },
  { id: "rm-dps", name: "Komang Ayu", branch: "KC Denpasar Renon", city: "Denpasar", lat: -8.6705, lon: 115.2412 },
];

/** Great-circle distance in km between two lat/lon points (Haversine). */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Resolved RM mapping shown on the RM phone, dashboard, and final summary. */
export interface RmAssignment {
  name: string;
  branch?: string;
  city?: string;
  /** Distance from the meeting point (km) — only for the nearest-RM mapping. */
  distanceKm?: number;
  /** How the RM was chosen. */
  source: "requested" | "nearest";
}

/**
 * Map an appointment to a Relationship Manager:
 *   - if `rmName` is filled → that RM (matched against the directory, else honored as typed)
 *   - otherwise → the RM nearest the picked meeting point (`lat`/`lon`)
 * Returns undefined when neither a name nor a location is available.
 */
export function assignRm(appointment: { rmName?: string; lat?: number; lon?: number }): RmAssignment | undefined {
  const requested = appointment.rmName?.trim();
  if (requested) {
    const match = RELATIONSHIP_MANAGERS.find((r) => r.name.toLowerCase() === requested.toLowerCase());
    return match
      ? { name: match.name, branch: match.branch, city: match.city, source: "requested" }
      : { name: requested, source: "requested" };
  }

  if (appointment.lat != null && appointment.lon != null) {
    let best: RelationshipManager | undefined;
    let bestDistance = Infinity;
    for (const rm of RELATIONSHIP_MANAGERS) {
      const d = haversineKm(appointment.lat, appointment.lon, rm.lat, rm.lon);
      if (d < bestDistance) {
        bestDistance = d;
        best = rm;
      }
    }
    if (best) {
      return { name: best.name, branch: best.branch, city: best.city, distanceKm: Math.round(bestDistance), source: "nearest" };
    }
  }

  return undefined;
}
