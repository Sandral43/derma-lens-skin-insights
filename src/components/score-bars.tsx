import { cn } from "@/lib/utils";

export function ScoreBars({
  scores,
  previous,
}: {
  scores: { hydration: number; texture: number; clarity: number };
  previous?: { hydration: number; texture: number; clarity: number } | null;
}) {
  const rows = [
    { key: "hydration", label: "Hydration" },
    { key: "texture", label: "Texture" },
    { key: "clarity", label: "Clarity" },
  ] as const;
  return (
    <div className="divide-y-2 divide-border">
      {rows.map((r) => {
        const v = scores[r.key];
        const delta = previous ? v - previous[r.key] : 0;
        return (
          <div key={r.key} className="flex items-center gap-4 py-4">
            <span className="w-24 text-lg font-black">{r.label}</span>
            <span
              className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label={r.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={v}
            >
              <span className="block h-full rounded-full bg-success transition-all" style={{ width: `${v}%` }} />
            </span>
            <span className="w-10 text-right text-lg font-black tabular-nums">{v}</span>
            {previous && (
              <span
                className={cn(
                  "w-9 text-right text-sm font-extrabold tabular-nums",
                  delta > 0 ? "text-success" : delta < 0 ? "text-muted-foreground" : "text-muted-foreground/60",
                )}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
