/**
 * Parse a Rumah123 listing HTML into the property fields we care about.
 *
 * Rumah123 embeds the data in the page: a schema.org JSON-LD block (price, geo,
 * address) plus Next.js data (land_size / building_size). This is a pure
 * function over the HTML string so it can be unit-tested without the network.
 */

export interface ParsedListing {
  luasTanah?: number;
  luasBangunan?: number;
  harga?: number;
  lat?: number;
  lon?: number;
  /** schema.org addressRegion (province) — fallback when geocode fails. */
  provinsi?: string;
  /** Kecamatan parsed from addressLocality (first part). */
  kecamatan?: string;
  /** Kota/Kabupaten parsed from addressLocality (last part). */
  kota?: string;
  /** schema.org addressLocality, e.g. "Bojong Gede, Bogor". */
  lokalitas?: string;
}

/** Parse a captured numeric string ("72" / "72,5") into a number. */
function num(s?: string): number | undefined {
  if (s == null) return undefined;
  const n = parseFloat(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** First capture group across a list of patterns. */
function pick(html: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1] != null) return m[1];
  }
  return undefined;
}

export function parseRumah123Html(html: string): ParsedListing {
  const harga = num(
    pick(html, [
      /"priceCurrency"\s*:\s*"IDR"\s*,\s*"price"\s*:\s*(\d{6,})/,
      /"price"\s*:\s*(\d{6,})/,
    ]),
  );

  const luasTanah = num(
    pick(html, [
      /"land_size"\s*:\s*"?(\d+(?:[.,]\d+)?)/,
      /landSize\\?"\s*:\s*\\?"(\d+(?:[.,]\d+)?)\s*m/,
      /landSize\\?"\s*:\s*\{\s*\\?"value\\?"\s*:\s*\\?"(\d+(?:[.,]\d+)?)/,
    ]),
  );

  const luasBangunan = num(
    pick(html, [
      /"building_size"\s*:\s*"?(\d+(?:[.,]\d+)?)/,
      /buildingSize\\?"\s*:\s*\\?"(\d+(?:[.,]\d+)?)\s*m/,
      /buildingSize\\?"\s*:\s*\{\s*\\?"value\\?"\s*:\s*\\?"(\d+(?:[.,]\d+)?)/,
    ]),
  );

  const lat = num(pick(html, [/"latitude"\s*:\s*(-?\d+\.\d+)/]));
  const lon = num(pick(html, [/"longitude"\s*:\s*(-?\d+\.\d+)/]));

  // The PROPERTY's PostalAddress sits just before its offer/price block. Anchor
  // extraction there so we don't accidentally grab the agent/organization
  // address (e.g. the Rumah123 office in Jakarta) elsewhere on the page.
  const priceAnchor = html.search(/"priceCurrency"\s*:\s*"IDR"/);
  const addrWindow = priceAnchor >= 0 ? html.slice(Math.max(0, priceAnchor - 700), priceAnchor) : "";
  const provinsi = pick(addrWindow, [/"addressRegion"\s*:\s*"([^"]+)"/]);
  const lokalitas = pick(addrWindow, [/"addressLocality"\s*:\s*"([^"]+)"/]);

  // addressLocality is typically "Kecamatan, Kota/Kabupaten".
  let kecamatan: string | undefined;
  let kota: string | undefined;
  if (lokalitas) {
    const parts = lokalitas.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      kecamatan = parts[0];
      kota = parts[parts.length - 1];
    } else if (parts.length === 1) {
      kota = parts[0];
    }
  }

  return { harga, luasTanah, luasBangunan, lat, lon, provinsi, kecamatan, kota, lokalitas };
}
