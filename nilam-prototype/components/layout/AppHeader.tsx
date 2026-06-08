"use client";

/**
 * Centered showcase title block — SOFIA/BRI design theme.
 *
 * Sits OUTSIDE the two canvases, horizontally centered at the top of the
 * page (mirrors SOFIA's ShowcaseHeader). Top to bottom:
 *   1. BRI navy→sky gradient cube logo + "NILAM" wordmark (row)
 *   2. Expanded subtitle
 *   3. "Demo Mode" pill
 *
 * Reset Flow is intentionally NOT here — it lives inside the dashboard
 * canvas (Custom Persona card) so the title block stays clean and centered.
 */
export function AppHeader() {
  return (
    <header className="flex flex-col items-center text-center">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #00529C 0%, #4FB3E8 100%)" }}
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
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
        <span className="text-2xl font-bold tracking-[0.18em] text-bri-navy">NILAM</span>
      </div>

      {/* Subtitle */}
      <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.22em] text-bri-muted">
        New Intelligent Loan Application Management
      </p>
    </header>
  );
}
