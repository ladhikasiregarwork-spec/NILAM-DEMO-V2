import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bri: {
          navy: "#00529C", blue: "#1A6FC4", sky: "#4FB3E8",
          bg: "#EAF2FB", bubble: "#F4F5F6", ink: "#111827",
          muted: "#6B7280", line: "#E5E7EB",
        },
        nilam: {
          ok: "#10B981", warn: "#F59E0B", run: "#1A6FC4", glow: "#4FB3E8",
        },
        nx: {
          blue:   "#2563EB",  // royal blue — primary brand (matches reference header logo + titles)
          indigo: "#4F46E5",  // indigo — logo gradient end
          bg:     "#F1F5F9",  // soft slate page background
          card:   "#FFFFFF",  // white card surface
          line:   "#E5E7EB",  // subtle border / divider
          ink:    "#0F172A",  // near-black text
          muted:  "#64748B",  // secondary / gray text
          ok:     "#16A34A",  // green success (status pills)
          okLight:"#DCFCE7",  // green pill background
        },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { card: "16px", bubble: "14px", pill: "999px" },
      boxShadow: {
        soft: "0 2px 12px rgba(16, 24, 40, 0.06)",
        panel: "0 8px 32px rgba(16, 24, 40, 0.10)",
        phone: "0 24px 60px rgba(16, 24, 40, 0.22)",
        glow: "0 0 0 4px rgba(79, 179, 232, 0.15)",
      },
      backgroundImage: {
        "nilam-glass": "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(234,242,251,0.6))",
      },
      keyframes: {
        "bubble-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "scan-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79,179,232,0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(79,179,232,0)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
      },
      animation: {
        "bubble-in": "bubble-in 0.28s ease-out",
        "dot-bounce": "dot-bounce 1.2s infinite ease-in-out",
        "scan-shimmer": "scan-shimmer 1.4s infinite linear",
        "glow-pulse": "glow-pulse 1.6s infinite ease-in-out",
        "shake": "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
