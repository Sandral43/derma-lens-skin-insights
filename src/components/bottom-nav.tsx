import { Link } from "@tanstack/react-router";
import { Calendar, Home, List, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/quests", label: "Quests", icon: List },
  { to: "/scan", label: "Scan", icon: ScanFace },
  { to: "/calendar", label: "Calendar", icon: Calendar },
] as const;

export function BottomNav({ activeOverride }: { activeOverride?: string | undefined }) {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-[2rem] border-2 border-b-0 border-border bg-card px-3 pt-3 shadow-pop"
    >
      <ul className="grid grid-cols-4 gap-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-0.5 rounded-3xl text-sm font-extrabold text-muted-foreground transition-colors",
                activeOverride === to && "bg-primary text-foreground",
              )}
              activeProps={{ className: "bg-primary !text-foreground" }}
            >
              <Icon className="h-6 w-6" strokeWidth={2.4} aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
