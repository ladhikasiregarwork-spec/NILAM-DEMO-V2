#!/usr/bin/env node
/**
 * Vehicle-catalog scraper (monthly job) — NILAM KPR/KKB demo.
 *
 * Decoupled from the web app: this runs on a schedule (e.g. once a month via
 * Windows Task Scheduler), scrapes a vehicle aggregator, and writes a JSON
 * snapshot to disk. The Next.js app reads that snapshot via /api/vehicles — it
 * never scrapes on the request path.
 *
 * Source: mobil123.com new-car listings (same group as the Rumah123 source the
 * app already uses). Official OEM brand sites were evaluated and rejected: ~half
 * block bots (403) and they don't publish clean OTR prices. The aggregator gives
 * consistent price + image + specs across every brand.
 *
 * Fetch strategy: mobil123 fingerprints the TLS/header stack, so Node's built-in
 * fetch() gets a 403 while the OS `curl` (ships with Windows 10 1803+) gets 200.
 * We therefore shell out to curl.
 *
 * Output conforms to the frontend `Vehicle` type (nilam-prototype/types/auto.ts).
 * Fields not present in a listing (seats, engineCc, fuel, description) are
 * derived heuristically from the title/body-type and flagged as approximate.
 *
 * Usage:
 *   node vehicle_catalog/scrape.mjs            # default: 6 pages
 *   PAGES=12 node vehicle_catalog/scrape.mjs   # scrape more pages
 *
 * Safety: writes atomically (temp file + rename) and refuses to overwrite a good
 * snapshot with a near-empty scrape (MIN_RECORDS gate), so one bad run can't wipe
 * the catalog.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, renameSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const execFileP = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(HERE, "vehicle_catalog.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://www.mobil123.com/mobil-dijual/indonesia?type=new";
const PAGES = Math.max(1, Number(process.env.PAGES) || 6);
const MIN_RECORDS = 10; // sanity gate: don't publish a near-empty catalog
const DELAY_MS = 1200; // be gentle between page fetches

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch one listing page via curl (with one retry). Returns HTML or "". */
async function fetchPage(pageNum, attempt = 0) {
  const url = pageNum > 1 ? `${BASE}&page_number=${pageNum}` : BASE;
  try {
    const { stdout } = await execFileP(
      "curl",
      ["-s", "--compressed", "-m", "40", "-A", UA, "-H", "Accept-Language: id-ID,id;q=0.9", url],
      { maxBuffer: 128 * 1024 * 1024 },
    );
    if (stdout.length < 5000) throw new Error(`short body (${stdout.length})`);
    return stdout;
  } catch (e) {
    if (attempt < 2) {
      await sleep(2000);
      return fetchPage(pageNum, attempt + 1);
    }
    console.warn(`  ! page ${pageNum} failed: ${e.message}`);
    return "";
  }
}

/** Read one HTML attribute value from a card chunk. */
const attr = (chunk, name) => {
  const m = chunk.match(new RegExp(`data-${name}="([^"]*)"`, "i"));
  return m ? decodeHtml(m[1].trim()) : "";
};
const decodeHtml = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Split the page into individual <article class="...listing--card..."> chunks. */
function splitCards(html) {
  const cards = [];
  const re = /<article[^>]*listing--card[\s\S]*?(?=<article[^>]*listing--card|<\/main|<footer)/gi;
  let m;
  while ((m = re.exec(html))) cards.push(m[0]);
  return cards;
}

/** Recover the real OTR price (the data-price attr is cipher-obfuscated, but the
 *  plaintext "(Rp 805.500.000)" is embedded in the prefilled chat text). */
function extractPrice(chunk) {
  const m = chunk.match(/\(Rp\s*([\d.]+)\)/);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isFinite(n) && n > 10_000_000 ? n : null; // sanity floor
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

/** Infer fuel from title/variant keywords. */
function deriveFuel(title) {
  const t = title.toLowerCase();
  if (/\b(ev|electric|listrik|bev)\b/.test(t)) return "Listrik";
  if (/\b(phev|plug-in)\b/.test(t)) return "Hybrid";
  if (/\b(hev|hybrid)\b/.test(t)) return "Hybrid";
  if (/\bdiesel\b/.test(t)) return "Diesel";
  return "Bensin";
}

/** Rough engine cc from a "1.5" / "2.4" displacement token in the title. */
function deriveCc(title, fuel) {
  if (fuel === "Listrik") return 0;
  const m = title.match(/\b([0-9])\.([0-9])\b/);
  return m ? Number(m[1] + m[2] + "00") : 0; // 1.5 -> 1500
}

/** Rough seat count from body type + a "7" hint in the title. */
function deriveSeats(bodyType, title) {
  if (/\b7\b/.test(title)) return 7;
  const b = (bodyType || "").toLowerCase();
  if (b === "mpv") return 7;
  if (b === "sedan" || b === "hatchback") return 5;
  return 5;
}

const mapTransmission = (t) => {
  const x = (t || "").toLowerCase();
  if (x.includes("manual")) return "Manual";
  if (x.includes("cvt")) return "CVT";
  return "Automatic";
};

/** Parse one card chunk into a Vehicle (or null if it lacks the essentials). */
function parseCard(chunk) {
  const make = attr(chunk, "make");
  const model = attr(chunk, "model");
  if (!make || !model) return null;
  const variant = attr(chunk, "variant");
  const year = Number(attr(chunk, "year")) || null;
  const bodyType = attr(chunk, "body-type") || "Lainnya";
  const image = attr(chunk, "image-src") || attr(chunk, "compare-image") || undefined;
  const price = extractPrice(chunk);
  if (!price) return null; // a catalog entry without a price is useless

  const fullName = [make, model, variant].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const fuel = deriveFuel(`${fullName} ${attr(chunk, "display-title")}`);
  const transmission = mapTransmission(attr(chunk, "transmission"));
  const highlights = [bodyType, fuel, transmission].filter(Boolean);

  return {
    id: slugify([make, model, variant, year].filter(Boolean).join(" ")),
    brand: make,
    model,
    variant: variant || "",
    fullName,
    year: year || new Date().getFullYear(),
    category: bodyType,
    price,
    image,
    seats: deriveSeats(bodyType, fullName),
    transmission,
    fuel,
    engineCc: deriveCc(fullName, fuel),
    description: `${fullName} — harga indikatif on-the-road dari listing mobil baru. Spesifikasi sebagian diperkirakan; konfirmasi ke dealer.`,
    highlights,
    sumber: "mobil123.com", // provenance (not part of the UI Vehicle type)
  };
}

/** Dedupe dealer ads → one entry per make+model+variant+year, keeping the
 *  lowest (most competitive) price as the representative OTR figure. */
function dedupe(vehicles) {
  const byKey = new Map();
  for (const v of vehicles) {
    const key = `${v.brand}|${v.model}|${v.variant}|${v.year}`.toLowerCase();
    const prev = byKey.get(key);
    if (!prev || v.price < prev.price) byKey.set(key, v);
  }
  return [...byKey.values()].sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model) || a.price - b.price,
  );
}

async function main() {
  console.log(`Scraping mobil123 new-car listings — ${PAGES} page(s)…`);
  const raw = [];
  for (let p = 1; p <= PAGES; p++) {
    const html = await fetchPage(p);
    if (!html) continue;
    const cards = splitCards(html);
    const parsed = cards.map(parseCard).filter(Boolean);
    console.log(`  page ${p}: ${cards.length} cards → ${parsed.length} parsed`);
    raw.push(...parsed);
    if (p < PAGES) await sleep(DELAY_MS);
  }

  const vehicles = dedupe(raw);
  console.log(`\nTotal: ${raw.length} listings → ${vehicles.length} unique models`);

  // Sanity gate: never overwrite a good snapshot with a near-empty scrape.
  if (vehicles.length < MIN_RECORDS) {
    console.error(`✗ Only ${vehicles.length} records (< ${MIN_RECORDS}). Keeping previous snapshot, not writing.`);
    if (existsSync(OUT_FILE)) {
      const prev = JSON.parse(readFileSync(OUT_FILE, "utf8"));
      console.error(`  Previous snapshot kept: ${prev.count ?? "?"} vehicles from ${prev.scrapedAt ?? "?"}`);
    }
    process.exit(1);
  }

  const snapshot = {
    source: "mobil123.com",
    scrapedAt: new Date().toISOString(),
    count: vehicles.length,
    vehicles,
  };

  // Atomic write: temp file then rename, so the app never reads a half-written file.
  const tmp = `${OUT_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2));
  renameSync(tmp, OUT_FILE);
  console.log(`✓ Wrote ${vehicles.length} vehicles → ${OUT_FILE}`);

  // Quick brand breakdown for the log.
  const byBrand = {};
  for (const v of vehicles) byBrand[v.brand] = (byBrand[v.brand] || 0) + 1;
  console.log("  Brands:", Object.entries(byBrand).map(([b, n]) => `${b}(${n})`).join(", "));
}

main().catch((e) => {
  console.error("✗ Scrape failed:", e);
  process.exit(1);
});
