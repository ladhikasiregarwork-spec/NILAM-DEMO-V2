import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
}

/**
 * iPhone-style bezel mockup — SOFIA theme.
 *
 * Layout strategy (fills the flex-1 wrapper in MobileApp):
 *   - `h-full` → fills the parent height (the flex-1 centering div).
 *   - `aspect-[9/19]` → maintains a proper tall-phone ratio (~0.47, like iPhone 15).
 *   - `max-w-full` → never wider than the 300px column.
 *   - The wrapper in MobileApp uses `flex items-center justify-center` so the
 *     phone is centred horizontally and the aspect ratio does the rest.
 *
 * Result: at any viewport height the phone scales to fill the available space
 * while keeping a real phone shape — no fixed-px brittleness, no empty gap below.
 */
export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div
      className="relative h-full max-w-full shrink-0"
      style={{
        aspectRatio: "9 / 19",
        background: "linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)",
        borderRadius: "2.2rem",
        padding: "8px",
        boxShadow:
          "0 24px 60px rgba(16,24,40,0.22), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 2px 4px rgba(255,255,255,0.12) inset",
      }}
    >
      {/* Silent / volume buttons (decorative, left side) */}
      <div
        className="absolute"
        style={{
          left: -3,
          top: "17%",
          width: 3,
          height: "6%",
          background: "#2a2a2a",
          borderRadius: "3px 0 0 3px",
        }}
      />
      <div
        className="absolute"
        style={{
          left: -3,
          top: "25%",
          width: 3,
          height: "10%",
          background: "#2a2a2a",
          borderRadius: "3px 0 0 3px",
        }}
      />
      <div
        className="absolute"
        style={{
          left: -3,
          top: "37%",
          width: 3,
          height: "10%",
          background: "#2a2a2a",
          borderRadius: "3px 0 0 3px",
        }}
      />
      {/* Power button (right side) */}
      <div
        className="absolute"
        style={{
          right: -3,
          top: "27%",
          width: 3,
          height: "13%",
          background: "#2a2a2a",
          borderRadius: "0 3px 3px 0",
        }}
      />

      {/* Inner screen */}
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white"
        style={{ borderRadius: "1.9rem" }}
      >
        {/* Dynamic Island notch */}
        <div className="absolute left-1/2 top-[6px] z-10 -translate-x-1/2">
          <div
            style={{
              width: "32%",
              aspectRatio: "4 / 1",
              background: "#0d0d0d",
              borderRadius: 999,
            }}
          />
        </div>

        {/* Screen content — pushed below notch area */}
        <div className="flex h-full flex-col pt-[28px]">{children}</div>
      </div>
    </div>
  );
}
