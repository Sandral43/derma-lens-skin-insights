import { Droplet, Sparkle, Archive, Sun, Moon, Leaf, Smile, Eye, Hand, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const QUEST_ICONS: Record<string, { icon: LucideIcon; tint: string; label: string }> = {
  drop: { icon: Droplet, tint: "bg-sky", label: "Cleanse" },
  sparkle: { icon: Sparkle, tint: "bg-blush", label: "Serum" },
  jar: { icon: Archive, tint: "bg-mint", label: "Moisturize" },
  sun: { icon: Sun, tint: "bg-butter", label: "Sun care" },
  moon: { icon: Moon, tint: "bg-sky", label: "Night care" },
  flask: { icon: FlaskConical, tint: "bg-blush", label: "Treatment" },
  leaf: { icon: Leaf, tint: "bg-mint", label: "Toner" },
  mask: { icon: Smile, tint: "bg-butter", label: "Mask" },
  eye: { icon: Eye, tint: "bg-sky", label: "Eye care" },
  hand: { icon: Hand, tint: "bg-blush", label: "Self-care" },
};

export function QuestIcon({ icon, className, size = "md" }: { icon: string; className?: string; size?: "md" | "lg" }) {
  const entry = QUEST_ICONS[icon] ?? QUEST_ICONS["drop"]!;
  const Icon = entry.icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "lg" ? "h-20 w-20 rounded-3xl" : "h-14 w-14 rounded-full",
        entry.tint,
        className,
      )}
    >
      <Icon className={size === "lg" ? "h-8 w-8" : "h-6 w-6"} strokeWidth={2.4} aria-hidden />
    </span>
  );
}
