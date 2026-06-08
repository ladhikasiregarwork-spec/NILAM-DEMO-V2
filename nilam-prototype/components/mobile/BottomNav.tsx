import { Home, FileText, Activity, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

/**
 * Bottom navigation bar — 4 items:
 *   Home | Pengajuan (active=blue) | Status | Profil
 * Pinned at screen bottom, thin top border, white background.
 */
export function BottomNav() {
  const items: NavItem[] = [
    { icon: <Home size={16} />, label: "Home", active: false },
    { icon: <FileText size={16} />, label: "Pengajuan", active: true },
    { icon: <Activity size={16} />, label: "Status", active: false },
    { icon: <User size={16} />, label: "Profil", active: false },
  ];

  return (
    <div className="flex shrink-0 items-center justify-around border-t border-bri-line bg-white px-1 py-1.5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-0.5 transition-colors",
            item.active ? "text-bri-navy" : "text-bri-muted"
          )}
        >
          {item.icon}
          <span
            className={cn(
              "text-[8px] font-medium leading-tight",
              item.active ? "text-bri-navy" : "text-bri-muted"
            )}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
