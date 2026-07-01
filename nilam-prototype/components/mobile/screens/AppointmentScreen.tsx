"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, User, CalendarDays, CalendarCheck, Search, Loader2, LocateFixed, Check, Headset, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/formatRupiah";
import { computeAutoLoan } from "@/lib/autoLoan";
import { schemeById } from "@/data/autoRates";
import { assignRm, RELATIONSHIP_MANAGERS } from "@/data/relationshipManagers";
import type { Vehicle, AutoLoanCalc, AppointmentData } from "@/types/auto";
import type { UserInput } from "@/types/userInput";

interface AppointmentScreenProps {
  vehicle?: Vehicle;
  calc: AutoLoanCalc;
  appointment: AppointmentData;
  setAppointment: (patch: Partial<AppointmentData>) => void;
  /** Borrower data (used to prefill the name from the KTP OCR result). */
  userInput: UserInput;
  setUserInput: (patch: Partial<UserInput>) => void;
  onConfirm: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

interface GeoHit {
  label: string;
  lat: number;
  lon: number;
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[8px] font-medium text-bri-muted">{label}</span>
      <div className="relative">
        <Icon size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-bri-muted" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-bri-line bg-white py-1.5 pl-7 pr-2 text-[10px] text-bri-ink outline-none focus:border-bri-blue"
        />
      </div>
    </label>
  );
}

/**
 * LocationPicker — pick the meeting point on a map. The customer searches a
 * place/address (Google Geocoding API, proxied via /api/geocode) or taps
 * "lokasi saat ini"; the choice is shown as a pin on a live Google Maps
 * preview. Picking stores both a human label (`lokasi`) and coordinates
 * (`lat`/`lon`).
 */
function LocationPicker({
  appointment,
  setAppointment,
}: {
  appointment: AppointmentData;
  setAppointment: (patch: Partial<AppointmentData>) => void;
}) {
  const [query, setQuery] = useState(appointment.lokasi ?? "");
  const [results, setResults] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picked = appointment.lat != null && appointment.lon != null;

  // Debounced forward search. Skips when the box already shows the picked label.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || q === appointment.lokasi) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const j = await r.json().catch(() => null);
        if (!cancelled) setResults(j?.ok ? (j.results as GeoHit[]) : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, appointment.lokasi]);

  function pick(hit: GeoHit) {
    setAppointment({ lokasi: hit.label, lat: hit.lat, lon: hit.lon });
    setQuery(hit.label);
    setResults([]);
    setError(null);
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Perangkat tidak mendukung lokasi");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const r = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const j = await r.json().catch(() => null);
          const hit: GeoHit | undefined = j?.ok ? j.results?.[0] : undefined;
          const label = hit?.label ?? fallback;
          setAppointment({ lokasi: label, lat: latitude, lon: longitude });
          setQuery(label);
        } catch {
          setAppointment({ lokasi: fallback, lat: latitude, lon: longitude });
          setQuery(fallback);
        } finally {
          setResults([]);
          setLocating(false);
        }
      },
      () => {
        setError("Tidak dapat mengakses lokasi perangkat");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapSrc =
    picked && mapsKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${appointment.lat},${appointment.lon}&zoom=16&language=id`
      : null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-medium text-bri-muted">Lokasi Pertemuan</span>

      {/* Search box */}
      <div className="relative">
        {searching ? (
          <Loader2 size={11} className="absolute left-2 top-1/2 -translate-y-1/2 animate-spin text-bri-blue" />
        ) : (
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-bri-muted" />
        )}
        <input
          type="text"
          value={query}
          placeholder="Cari alamat / tempat / dealer…"
          onChange={(e) => {
            setQuery(e.target.value);
            // Editing invalidates a previously picked pin until re-selected.
            if (picked) setAppointment({ lat: undefined, lon: undefined });
          }}
          className="w-full rounded-lg border border-bri-line bg-white py-1.5 pl-7 pr-2 text-[10px] text-bri-ink outline-none focus:border-bri-blue"
        />
      </div>

      {/* Current-location shortcut */}
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="flex items-center gap-1 self-start text-[8px] font-medium text-bri-blue transition-colors hover:text-bri-navy disabled:opacity-60"
      >
        {locating ? <Loader2 size={9} className="animate-spin" /> : <LocateFixed size={9} />}
        Gunakan lokasi saat ini
      </button>

      {error && <p className="text-[8px] text-rose-500">{error}</p>}

      {/* Result list */}
      {results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-lg border border-bri-line bg-white">
          {results.map((hit, i) => (
            <li key={`${hit.lat},${hit.lon},${i}`}>
              <button
                type="button"
                onClick={() => pick(hit)}
                className="flex w-full items-start gap-1.5 border-b border-bri-line/60 px-2 py-1.5 text-left last:border-0 hover:bg-bri-bg/60"
              >
                <MapPin size={10} className="mt-0.5 shrink-0 text-bri-blue" />
                <span className="text-[9px] leading-tight text-bri-ink">{hit.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Map preview with the pin */}
      {picked && mapSrc && (
        <div className="mt-0.5 overflow-hidden rounded-lg border border-bri-line">
          <iframe
            key={mapSrc}
            title="Peta lokasi pertemuan"
            src={mapSrc}
            className="h-28 w-full"
            loading="lazy"
          />
          <div className="flex items-center gap-1 border-t border-bri-line bg-bri-bg/50 px-2 py-1">
            <Check size={9} className="shrink-0 text-emerald-600" />
            <span className="truncate text-[8px] text-bri-ink">{appointment.lokasi}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RmAgentPicker — custom combobox for choosing a BRIF Agent. Replaces the
 * native <input list> + <datalist> pair, whose browser-rendered dropdown
 * doesn't pick up app styling (shows as a plain black-on-white OS list).
 */
function RmAgentPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-0.5">
      <span className="text-[8px] font-medium text-bri-muted">BRIF Agent (opsional)</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex w-full items-center gap-1.5 rounded-lg border border-bri-line bg-white py-1.5 pl-7 pr-7 text-left text-[10px] outline-none focus:border-bri-blue"
      >
        <Headset size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-bri-muted" />
        <span className={cn("truncate", value ? "text-bri-ink" : "text-bri-muted")}>
          {value || "Pilih — kosong = BRIF Agent terdekat"}
        </span>
        <ChevronDown size={11} className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-bri-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-y-auto scroll-thin rounded-lg border border-bri-line bg-white shadow-soft">
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className="flex w-full items-center gap-1.5 border-b border-bri-line/60 px-2.5 py-1.5 text-left hover:bg-bri-bg/60"
          >
            <X size={10} className="shrink-0 text-bri-muted" />
            <span className="text-[9px] font-medium text-bri-muted">Kosongkan (terdekat otomatis)</span>
          </button>
          {RELATIONSHIP_MANAGERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange(r.name);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-1.5 border-b border-bri-line/60 px-2.5 py-1.5 text-left last:border-0 hover:bg-bri-bg/60",
                value === r.name && "bg-bri-blue/5",
              )}
            >
              <Headset size={10} className="mt-0.5 shrink-0 text-bri-blue" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9.5px] font-semibold text-bri-ink">{r.name}</span>
                <span className="block truncate text-[8px] text-bri-muted">{r.branch} · {r.city}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * DatePicker — custom calendar popover for "Tanggal Diinginkan". Replaces the
 * native <input type="date">, whose calendar UI is rendered by the OS/browser
 * chrome and can't be styled to match the app (looks dated, inconsistent
 * across devices). Stores/emits the same ISO yyyy-mm-dd string.
 */
function DatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(() => selected ?? today);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  useEffect(() => {
    if (open) setViewMonth(selected ?? today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const label = selected
    ? selected.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Pilih tanggal";

  return (
    <div ref={rootRef} className="relative flex flex-col gap-0.5">
      <span className="text-[8px] font-medium text-bri-muted">Tanggal Diinginkan</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex w-full items-center gap-1.5 rounded-lg border border-bri-line bg-white py-1.5 pl-7 pr-2 text-left text-[10px] outline-none focus:border-bri-blue"
      >
        <CalendarDays size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-bri-muted" />
        <span className={cn("truncate", selected ? "text-bri-ink" : "text-bri-muted")}>{label}</span>
      </button>

      {open && (
        <div className="absolute top-full z-20 mt-1 w-full rounded-lg border border-bri-line bg-white p-2 shadow-soft">
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className="flex h-5 w-5 items-center justify-center rounded text-bri-muted hover:bg-bri-bg hover:text-bri-ink"
              aria-label="Bulan sebelumnya"
            >
              <ChevronDown size={11} className="rotate-90" />
            </button>
            <span className="text-[9.5px] font-semibold text-bri-ink">{MONTH_LABELS[month]} {year}</span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className="flex h-5 w-5 items-center justify-center rounded text-bri-muted hover:bg-bri-bg hover:text-bri-ink"
              aria-label="Bulan berikutnya"
            >
              <ChevronDown size={11} className="-rotate-90" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="flex h-5 items-center justify-center text-[7.5px] font-semibold text-bri-muted">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`empty-${i}`} />;
              const isPast = d < today;
              const isSelected = selected && isSameDay(d, selected);
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    onChange(toIsoDate(d));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[9px] tabular-nums transition-colors",
                    isPast && "cursor-not-allowed text-bri-muted/30",
                    !isPast && !isSelected && "text-bri-ink hover:bg-bri-bg",
                    isSelected && "bg-bri-blue font-semibold text-white",
                    !isSelected && isToday && "font-semibold text-bri-blue",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AppointmentScreen — after the customer agrees to the loan simulation, collect
 * where & when to meet a BRI agent: a map-picked meeting point, the name
 * (prefilled from KTP), and a preferred date.
 */
export function AppointmentScreen({
  vehicle,
  calc,
  appointment,
  setAppointment,
  userInput,
  setUserInput,
  onConfirm,
  onGoBack,
  canGoBack,
}: AppointmentScreenProps) {
  const scheme = schemeById(calc.schemeId);
  const loan = vehicle
    ? computeAutoLoan(vehicle.price, calc.dpPct, scheme.rate, calc.tenorMonths, calc.discountPct)
    : undefined;

  // Live preview of which RM the application will be routed to.
  const rm = assignRm(appointment);

  // Prefill the name from the KTP OCR result (once, if not already set/edited).
  useEffect(() => {
    if (!appointment.nama && userInput.nama) {
      setAppointment({ nama: userInput.nama });
    }
  }, [userInput.nama, appointment.nama, setAppointment]);

  const canSubmit =
    !!appointment.lokasi?.trim() &&
    appointment.lat != null &&
    appointment.lon != null &&
    !!appointment.nama?.trim() &&
    !!appointment.tanggal;

  function handleSubmit() {
    if (!canSubmit) return;
    setAppointment({ booked: true });
    onConfirm();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin px-3 py-2">
      <div className="mb-2">
        <h2 className="text-[13px] font-bold text-bri-ink">Buat Janji Temu</h2>
        <p className="text-[9px] text-bri-muted">Agen kami akan menemui Anda untuk proses lanjutan</p>
      </div>

      {/* Mini recap of the chosen deal */}
      {vehicle && loan && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-bri-line bg-bri-bg/50 px-2.5 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold text-bri-ink">{vehicle.fullName}</p>
            <p className="text-[7.5px] text-bri-muted">
              {calc.tenorMonths / 12} thn · DP {Math.round(calc.dpPct * 100)}% · {scheme.rateLabel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[7px] text-bri-muted">Angsuran/bln</p>
            <p className="text-[10px] font-bold text-bri-blue">{formatRupiah(loan.angsuran)}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex flex-col gap-1.5">
        <LocationPicker appointment={appointment} setAppointment={setAppointment} />
        <Field
          label="Nama Lengkap"
          icon={User}
          value={appointment.nama ?? ""}
          onChange={(v) => {
            setAppointment({ nama: v });
            setUserInput({ nama: v });
          }}
          placeholder="Nama sesuai KTP"
        />
        <div className="flex flex-col gap-0.5">
          <RmAgentPicker
            value={appointment.rmName}
            onChange={(v) => setAppointment({ rmName: v })}
          />
          {rm && (
            <p className="flex items-start gap-1 pl-0.5 text-[8px] text-bri-muted">
              <Headset size={9} className="mt-0.5 shrink-0 text-bri-blue" />
              {rm.source === "requested" ? (
                <span>Pengajuan diarahkan ke BRIF Agent: <span className="font-semibold text-bri-ink">{rm.name}</span>{rm.branch ? ` · ${rm.branch}` : ""}</span>
              ) : (
                <span>
                  Otomatis ke BRIF Agent terdekat: <span className="font-semibold text-bri-ink">{rm.name}</span>
                  {rm.city ? ` · ${rm.city}` : ""}
                  {rm.distanceKm != null ? ` (~${rm.distanceKm} km)` : ""}
                </span>
              )}
            </p>
          )}
        </div>
        <DatePicker
          value={appointment.tanggal ?? ""}
          onChange={(v) => setAppointment({ tanggal: v })}
        />
      </div>

      <div className="flex-1" />

      {!canSubmit && (
        <p className="mt-2 text-center text-[8px] text-bri-muted">
          Pilih lokasi di peta &amp; lengkapi data untuk membuat janji temu.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          "mt-2 flex w-full items-center justify-center gap-2 rounded-bubble py-2.5 text-[12px] font-semibold text-white transition-all",
          canSubmit ? "hover:opacity-90 active:scale-[0.98]" : "cursor-not-allowed opacity-60",
        )}
        style={{ background: canSubmit ? "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)" : "#94A3B8" }}
      >
        <CalendarCheck size={14} /> Buat Janji Temu
      </button>

      {canGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="mt-2 text-center text-[10px] text-bri-muted transition-colors hover:text-bri-blue"
        >
          ← Kembali
        </button>
      )}
    </div>
  );
}
