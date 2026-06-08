import { Menu } from "lucide-react";

/**
 * In-screen top header bar — SOFIA/BRI theme.
 *   LEFT  — small BRI navy→sky cube logo + "NILAM" (bri-navy, bold)
 *   RIGHT — hamburger Menu icon (bri-muted)
 * Thin bottom border (bri-line) separates it from screen content.
 */
export function MobileHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-bri-line bg-white px-3 py-2">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-1.5">
        {/* Small cube logo — BRI navy→sky, matches AppHeader */}
        <div
          className="flex h-5 w-5 items-center justify-center rounded"
          style={{
            background: "linear-gradient(135deg, #00529C 0%, #4FB3E8 100%)",
          }}
          aria-hidden="true"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1.5L15.5 5.25V12.75L9 16.5L2.5 12.75V5.25L9 1.5Z"
              stroke="white"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <line x1="9" y1="5" x2="9" y2="13" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="5" y1="7" x2="13" y2="11" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="13" y1="7" x2="5" y2="11" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="9" cy="9" r="1.3" fill="white" />
          </svg>
        </div>
        <span className="text-[11px] font-bold tracking-widest text-bri-navy">NILAM</span>
      </div>

      {/* Hamburger */}
      <Menu size={16} className="text-bri-muted" aria-label="Menu" />
    </div>
  );
}
