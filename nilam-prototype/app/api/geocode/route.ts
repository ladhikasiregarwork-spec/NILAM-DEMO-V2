export const runtime = "nodejs";

const NOMINATIM_UA = "NILAM-KPR/1.0 (at.gondrol@gmail.com)";

export interface GeocodeResult {
  /** Display label, e.g. "Dealer BRI Fatmawati, Jakarta Selatan". */
  label: string;
  lat: number;
  lon: number;
}

/**
 * GET /api/geocode
 *
 * Proxies OpenStreetMap/Nominatim so the appointment screen can pick a meeting
 * point without a Google Maps key. Two modes:
 *   ?q=<text>            forward search → up to 6 matching places (Indonesia)
 *   ?lat=<n>&lon=<n>     reverse geocode → the single place at that point
 *
 * Proxied server-side (rather than called from the browser) to keep a stable
 * User-Agent per the Nominatim usage policy and avoid CORS surprises.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  // Reverse geocode (e.g. "use my current location").
  if (lat && lon) {
    const nu = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&accept-language=id`;
    try {
      const r = await fetch(nu, { headers: { "User-Agent": NOMINATIM_UA } });
      if (!r.ok) {
        return Response.json({ ok: false, error: `Gagal membaca lokasi (${r.status})` }, { status: 502 });
      }
      const j: any = await r.json();
      if (!j?.display_name) {
        return Response.json({ ok: false, error: "Lokasi tidak ditemukan" }, { status: 404 });
      }
      const result: GeocodeResult = { label: j.display_name, lat: Number(j.lat), lon: Number(j.lon) };
      return Response.json({ ok: true, results: [result] });
    } catch {
      return Response.json({ ok: false, error: "Tidak dapat menghubungi server lokasi" }, { status: 502 });
    }
  }

  // Forward search.
  if (!q) {
    return Response.json({ ok: false, error: "Kata kunci lokasi kosong" }, { status: 400 });
  }
  const nu = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&countrycodes=id&accept-language=id`;
  try {
    const r = await fetch(nu, { headers: { "User-Agent": NOMINATIM_UA } });
    if (!r.ok) {
      return Response.json({ ok: false, error: `Gagal mencari lokasi (${r.status})` }, { status: 502 });
    }
    const j: any[] = await r.json();
    const results: GeocodeResult[] = (j ?? [])
      .map((it) => ({ label: it.display_name as string, lat: Number(it.lat), lon: Number(it.lon) }))
      .filter((it) => it.label && Number.isFinite(it.lat) && Number.isFinite(it.lon));
    return Response.json({ ok: true, results });
  } catch {
    return Response.json({ ok: false, error: "Tidak dapat menghubungi server lokasi" }, { status: 502 });
  }
}
