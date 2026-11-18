import { Check } from "lucide-react";
import { Chick } from "@/components/chick";
import type { SurveyQuestion } from "@/lib/survey";
import { cn } from "@/lib/utils";

export function SurveyStep({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string | string[] | null;
  onChange: (v: string | string[]) => void;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  function toggle(v: string) {
    if (question.kind === "single") return onChange(v);
    const none = question.noneValue;
    if (none && v === none) return onChange(selected.includes(v) ? [] : [v]);
    const base = selected.filter((s) => s !== none);
    onChange(base.includes(v) ? base.filter((s) => s !== v) : [...base, v]);
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <Chick className="w-20 shrink-0" mood="thinking" />
        <div className="bubble flex-1 text-xl font-black">{question.question}</div>
      </div>
      {question.kind === "multi" && (
        <p className="mt-4 text-center font-bold text-muted-foreground">Select all that apply</p>
      )}
      <div role={question.kind === "single" ? "radiogroup" : "group"} className="mt-5 flex flex-col gap-3">
        {question.options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role={question.kind === "single" ? "radio" : "checkbox"}
              aria-checked={on}
              onClick={() => toggle(o.value)}
              className={cn(
                "flex min-h-16 items-center gap-4 rounded-[1.6rem] border-2 px-5 text-left text-lg font-extrabold shadow-slab transition-colors",
                on ? "border-primary-deep bg-primary-soft" : "border-border bg-card",
              )}
            >
              {question.kind === "single" ? (
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px]",
                    on ? "border-foreground" : "border-lavender",
                  )}
                >
                  {on && <span className="h-4 w-4 rounded-full bg-foreground" />}
                </span>
              ) : (
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-[3px]",
                    on ? "border-foreground bg-foreground text-card" : "border-lavender",
                  )}
                >
                  {on && <Check className="h-5 w-5" strokeWidth={3.5} />}
                </span>
              )}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
