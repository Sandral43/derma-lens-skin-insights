import { cn } from "@/lib/utils";

export type ChickMood = "happy" | "joy" | "thinking" | "concerned";

/** DermaLens buddy: a round yellow chick, drawn as flat SVG so it scales crisply. */
export function Chick({
  className,
  mood = "happy",
  shadow = true,
  label,
}: {
  className?: string;
  mood?: ChickMood;
  shadow?: boolean;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 205"
      className={cn("block", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {shadow && <ellipse cx="100" cy="194" rx="46" ry="8" className="fill-foreground/15" />}
      <ellipse cx="36" cy="122" rx="19" ry="32" className="fill-chick-wing" />
      <ellipse cx="164" cy="122" rx="19" ry="32" className="fill-chick-wing" />
      <path d="M92 44 C 86 26, 98 16, 104 14 C 104 26, 112 32, 124 34 C 112 38, 104 40, 100 46 Z" className="fill-chick-wing" />
      <circle cx="100" cy="112" r="72" className="fill-chick" />
      <ellipse cx="100" cy="140" rx="50" ry="40" className="fill-chick-belly" />
      <ellipse cx="60" cy="122" rx="12" ry="7.5" className="fill-chick-cheek" />
      <ellipse cx="140" cy="122" rx="12" ry="7.5" className="fill-chick-cheek" />

      {mood === "joy" ? (
        <>
          <path d="M68 104 Q 78 92 88 104" strokeWidth="6" strokeLinecap="round" fill="none" className="stroke-foreground" />
          <path d="M112 104 Q 122 92 132 104" strokeWidth="6" strokeLinecap="round" fill="none" className="stroke-foreground" />
        </>
      ) : (
        <>
          <circle cx={mood === "thinking" ? 81 : 78} cy={mood === "thinking" ? 96 : 102} r="10" className="fill-foreground" />
          <circle cx={mood === "thinking" ? 125 : 122} cy={mood === "thinking" ? 96 : 102} r="10" className="fill-foreground" />
          <circle cx={mood === "thinking" ? 84 : 81} cy={mood === "thinking" ? 92 : 98} r="3.2" className="fill-card" />
          <circle cx={mood === "thinking" ? 128 : 125} cy={mood === "thinking" ? 92 : 98} r="3.2" className="fill-card" />
        </>
      )}
      {mood === "concerned" && (
        <>
          <path d="M66 90 L 88 82" strokeWidth="5" strokeLinecap="round" className="stroke-foreground" />
          <path d="M134 90 L 112 82" strokeWidth="5" strokeLinecap="round" className="stroke-foreground" />
        </>
      )}
      <path d="M88 114 L 112 114 L 100 130 Z" strokeLinejoin="round" strokeWidth="3" className="fill-chick-beak stroke-chick-beak" />
    </svg>
  );
}
