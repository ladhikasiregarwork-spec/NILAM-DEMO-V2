"use client";

import { cn } from "@/lib/cn";
import type { GeoPoint } from "@/lib/cardAnalytics";

interface GeoRadiusCardProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subtitle?: string;
  point: GeoPoint;
  /** DUMMY badge (amber). Ignored when `badge` is set. */
  dummy?: boolean;
  /** Custom corner badge text (overrides the DUMMY badge). */
  badge?: string;
  /** Colour tone for the custom badge. */
  badgeTone?: "amber" | "emerald" | "slate";
  className?: string;
}

const BADGE_TONE: Record<NonNullable<GeoRadiusCardProps["badgeTone"]>, string> = {
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-100 text-slate-600",
};

/**
 * GeoRadiusCard — draws a circular radius (geofence) of a given size centred on a
 * lat/long coordinate. The filled circle is the applicant's radius; faint range
 * rings give scale. A geospatial radius around the coordinate — not a chart.
 */
export function GeoRadiusCard({ title, icon: Icon, subtitle, point, dummy, badge, badgeTone = "amber", className }: GeoRadiusCardProps) {
  const W = 180;
  const H = 132;
  const cx = W / 2;
  const cy = 60;
  const R = 36; // main radius circle (px)
  const vx = cx + R; // radius-line endpoint (east)

  // Real map (Google Maps Embed API — free, unmetered). Pick a zoom from the
  // radius so the overlaid circle reflects the true distance on the tiles, then
  // draw the circle at its actual pixel size for that zoom (Web-Mercator scale).
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const latRad = (point.lat * Math.PI) / 180;
  const TARGET_PX = 40; // desired on-screen radius → drives the zoom choice
  const rMeters = Math.max(50, point.radiusKm * 1000);
  const zoom = Math.max(
    11,
    Math.min(17, Math.round(Math.log2((156543.03392 * Math.cos(latRad) * TARGET_PX) / rMeters))),
  );
  const metersPerPx = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
  const circlePx = rMeters / metersPerPx; // true radius in CSS px at this zoom
  const mapSrc = mapsKey
    ? `https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${point.lat},${point.lon}&zoom=${zoom}&maptype=roadmap`
    : null;

  return (
    <div className={cn("flex h-full flex-col rounded-xl border border-bri-line bg-white px-3 py-2.5 shadow-soft", className)}>
      <div className="mb-1.5 flex items-center gap-1">
        <Icon size={11} className="text-bri-navy" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-bri-muted">{title}</span>
        {badge ? (
          <span className={cn("ml-auto rounded-pill px-1.5 py-px text-[7px] font-bold", BADGE_TONE[badgeTone])}>{badge}</span>
        ) : (
          dummy && <span className="ml-auto rounded-pill bg-amber-100 px-1.5 py-px text-[7px] font-bold text-amber-700">DUMMY</span>
        )}
      </div>
      {subtitle && <p className="mb-1 text-[8px] leading-tight text-bri-muted">{subtitle}</p>}

      {/* radius map — real Google map + scale-correct radius overlay (SVG fallback if no key) */}
      <div className="relative h-28 overflow-hidden rounded-lg border border-bri-line bg-[#F1F5F9]">
        {mapSrc ? (
          <>
            <iframe
              title={`Peta ${title}`}
              src={mapSrc}
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              aria-hidden="true"
            />
            {/* radius circle + centre marker, centred on the map (real distance scale) */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <circle cx="50%" cy="50%" r={circlePx} fill="rgba(0,82,156,0.14)" stroke="#00529C" strokeWidth={1.4} />
              <circle cx="50%" cy="50%" r={5.5} fill="none" stroke="#00529C" strokeWidth={0.9} opacity={0.5} />
              <circle cx="50%" cy="50%" r={2.8} fill="#00529C" />
            </svg>
          </>
        ) : (
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block" aria-hidden="true">
            {/* faint map gridlines */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={`h${f}`} x1={0} y1={H * f} x2={W} y2={H * f} stroke="#E2E8F0" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            ))}
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={`v${f}`} x1={W * f} y1={0} x2={W * f} y2={H} stroke="#E2E8F0" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            ))}

            {/* faint range rings for scale */}
            {[R / 3, (2 * R) / 3].map((r) => (
              <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#CBD5E1" strokeWidth={0.8} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            ))}

            {/* the applicant's radius */}
            <circle cx={cx} cy={cy} r={R} fill="rgba(0,82,156,0.14)" stroke="#00529C" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />

            {/* radius indicator */}
            <line x1={cx} y1={cy} x2={vx} y2={cy} stroke="#00529C" strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <text x={(cx + vx) / 2} y={cy - 2.5} textAnchor="middle" fontSize="7" fill="#00529C" fontWeight="700">r</text>

            {/* centre marker at the coordinate */}
            <circle cx={cx} cy={cy} r={2.6} fill="#00529C" />
            <circle cx={cx} cy={cy} r={5.5} fill="none" stroke="#00529C" strokeWidth={0.8} opacity={0.45} vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      {/* coordinate readout */}
      <div className="mt-1.5 flex flex-col gap-0.5 rounded-lg bg-bri-bg/50 px-2 py-1.5">
        <Row label="Latitude" value={point.lat.toFixed(5)} />
        <Row label="Longitude" value={point.lon.toFixed(5)} />
        <Row label="Radius" value={`${point.radiusKm.toFixed(1)} km`} />
        <Row label="Area" value={point.area} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[7.5px] text-bri-muted">{label}</span>
      <span className="text-[8.5px] font-semibold tabular-nums text-bri-ink">{value}</span>
    </div>
  );
}
