"use client";

import { cn } from "@/lib/cn";

interface OpeningScreenProps {
  onStart: () => void;
  /** Optional override — defaults to true since persona always exists now */
  personaSelected?: boolean;
}

/**
 * Opening screen — centered NILAM logo + brand mark + tagline + "Mulai" button.
 * Compact: fits within ~300px screen height with no scroll.
 *
 * personaSelected defaults to true since a default persona always exists.
 */
export function OpeningScreen({ onStart, personaSelected = true }: OpeningScreenProps) {
  const enabled = personaSelected;

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-5 py-3">
      {/* Logo mark — BRI navy→sky gradient */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        style={{
          background: "linear-gradient(135deg, #00529C 0%, #4FB3E8 100%)",
        }}
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z"
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <line x1="9" y1="5" x2="9" y2="13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5" y1="7" x2="13" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="13" y1="7" x2="5" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="9" cy="9" r="1.2" fill="white" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <p className="text-lg font-bold tracking-widest text-bri-ink">NILAM</p>
        <p className="mt-0.5 text-[10px] text-bri-muted">New Intelligent Loan Application</p>
      </div>

      {/* Tagline */}
      <p className="text-center text-[10px] leading-relaxed text-bri-muted">
        Ajukan kredit dengan mudah &amp; cepat.
      </p>

      {/* Mulai button — BRI navy gradient */}
      <div className="w-full shrink-0">
        <button
          type="button"
          onClick={enabled ? onStart : undefined}
          disabled={!enabled}
          className={cn(
            "w-full rounded-bubble py-2 text-sm font-semibold text-white transition-all",
            enabled
              ? "cursor-pointer hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed opacity-50"
          )}
          style={{
            background: enabled
              ? "linear-gradient(135deg, #00529C 0%, #1A6FC4 100%)"
              : "#94A3B8",
          }}
        >
          Mulai
        </button>
      </div>
    </div>
  );
}
