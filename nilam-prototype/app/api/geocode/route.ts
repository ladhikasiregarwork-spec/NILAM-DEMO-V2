export const runtime = "nodejs";

export interface GeocodeResult {
  /** Display label, e.g. "Dealer BRI Fatmawati, Jakarta Selatan". */
  label: string;
  lat: number;
  lon: number;
}

/**
 * GET /api/geocode
 *
 * Proxies the Google Geocoding API so the appointment screen can pick a
 * meeting point. Two modes:
 *   ?q=<text>            forward search → up to 6 matching places (Indonesia)
 *   ?lat=<n>&lon=<n>     reverse geocode → the single place at that point
 *
 * Proxied server-side to keep GOOGLE_MAPS_API_KEY off the client.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "GOOGLE_MAPS_API_KEY belum diset di .env.local" },
      { status: 500 },
    );
  }

  // Reverse geocode (e.g. "use my current location").
  if (lat && lon) {
    const gu = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&language=id&region=id&key=${apiKey}`;
    try {
      const r = await fetch(gu);
      const j: any = await r.json().catch(() => null);
      if (!r.ok || !j || j.status !== "OK" || !j.results?.length) {
        return Response.json({ ok: false, error: "Lokasi tidak ditemukan" }, { status: 404 });
      }
      const first = j.results[0];
      const result: GeocodeResult = {
        label: first.formatted_address,
        lat: first.geometry.location.lat,
        lon: first.geometry.location.lng,
      };
      return Response.json({ ok: true, results: [result] });
    } catch {
      return Response.json({ ok: false, error: "Tidak dapat menghubungi server lokasi" }, { status: 502 });
    }
  }

  // Forward search.
  if (!q) {
    return Response.json({ ok: false, error: "Kata kunci lokasi kosong" }, { status: 400 });
  }
  const gu = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&language=id&region=id&components=country:ID&key=${apiKey}`;
  try {
    const r = await fetch(gu);
    const j: any = await r.json().catch(() => null);
    if (!r.ok || !j || (j.status !== "OK" && j.status !== "ZERO_RESULTS")) {
      return Response.json({ ok: false, error: `Gagal mencari lokasi (${j?.status ?? r.status})` }, { status: 502 });
    }
    const results: GeocodeResult[] = (j.results ?? [])
      .slice(0, 6)
      .map((it: any) => ({
        label: it.formatted_address as string,
        lat: it.geometry.location.lat as number,
        lon: it.geometry.location.lng as number,
      }))
      .filter((it: GeocodeResult) => it.label && Number.isFinite(it.lat) && Number.isFinite(it.lon));
    return Response.json({ ok: true, results });
  } catch {
    return Response.json({ ok: false, error: "Tidak dapat menghubungi server lokasi" }, { status: 502 });
  }
}
