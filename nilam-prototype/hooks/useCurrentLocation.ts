"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@/lib/cardAnalytics";

export type GeoStatus = "idle" | "locating" | "ok" | "denied" | "unsupported";

export interface CurrentLocation {
  status: GeoStatus;
  /** Real geo point once resolved (device lat/lon + reverse-geocoded area). */
  point: GeoPoint | null;
  /** Re-request the device location (e.g. after the user grants permission). */
  request: () => void;
}

/** Shorten a Google `formatted_address` to a compact "kecamatan, kota" label. */
function shortArea(label: string): string {
  const parts = label.split(",").map((s) => s.trim()).filter(Boolean);
  const strip = (s: string) => s.replace(/^(kecamatan|kec\.?|kota|kabupaten|kab\.?)\s+/i, "");
  const kec = parts.find((p) => /^(kecamatan|kec\.?)\s/i.test(p));
  const kota = parts.find((p) => /^(kota|kabupaten|kab\.?)\s/i.test(p));
  if (kec || kota) return [kec, kota].filter((x): x is string => !!x).map(strip).join(", ");
  // No admin markers → drop the country and postal-code tail, keep the last two.
  if (parts.length >= 3) return parts.slice(-3, -1).join(", ");
  return label;
}

/**
 * useCurrentLocation — reads the browser's REAL geolocation and reverse-geocodes
 * it (via /api/geocode) into a GeoPoint. Auto-requests once on mount; callers
 * fall back to a dummy point until `status === "ok"`. The circle radius is the
 * GPS accuracy (metres → km, floored so it stays visible).
 *
 * Note: geolocation only resolves in a secure context — http://localhost counts,
 * but a bare LAN IP does not (the browser blocks it → status "denied").
 */
export function useCurrentLocation(): CurrentLocation {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const inFlight = useRef(false);

  const request = useCallback(() => {
    if (inFlight.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    inFlight.current = true;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const radiusKm = Math.max(0.1, (accuracy || 0) / 1000);
        let area = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const r = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const j = await r.json().catch(() => null);
          const label: string | undefined = j?.ok ? j.results?.[0]?.label : undefined;
          if (label) area = shortArea(label);
        } catch {
          /* keep the coordinate fallback as the area label */
        }
        setPoint({ lat: latitude, lon: longitude, area, radiusKm });
        setStatus("ok");
        inFlight.current = false;
      },
      () => {
        setStatus("denied");
        inFlight.current = false;
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { status, point, request };
}
