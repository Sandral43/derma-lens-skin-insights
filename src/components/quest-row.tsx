import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Coin } from "@/components/coin";
import { QuestIcon } from "@/components/quest-icon";
import { useToggleQuest, type Quest } from "@/lib/data";
import { cn } from "@/lib/utils";

export function QuestRow({ quest, done, dateKey }: { quest: Quest; done: boolean; dateKey: string }) {
  const toggle = useToggleQuest();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [burst, setBurst] = useState(0);
  const isDone = optimistic ?? done;

  function onClick() {
    const next = !isDone;
    setOptimistic(next);
    if (next) setBurst((b) => b + 1);
    toggle.mutate(
      { quest, dateKey, done: next },
      {
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Couldn't save that. Try again.");
        },
        onSettled: () => setOptimistic(null),
      },
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isDone}
      aria-label={`${quest.title}${quest.product ? `, ${quest.product}` : ""}, ${quest.reward} coins`}
      onClick={onClick}
      className={cn(
        "card-cozy flex w-full items-center gap-3 px-4 py-4 text-left transition-colors",
        isDone && "bg-mint/40",
      )}
    >
      <QuestIcon icon={quest.icon} className="h-12 w-12" />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-lg font-black leading-tight", isDone && "line-through decoration-2 opacity-70")}>
          {quest.title}
        </span>
        {quest.product && (
          <span className="block truncate font-semibold text-muted-foreground">{quest.product}</span>
        )}
      </span>
      <span className="relative flex shrink-0 items-center gap-1 font-black">
        <Coin />+{quest.reward}
        {burst > 0 && isDone && (
          <span key={burst} aria-hidden className="absolute -top-3 left-0 animate-coin text-sm font-black text-coin-edge">
            +{quest.reward}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] transition-colors",
          isDone ? "border-success bg-success text-success-foreground" : "border-success/70",
        )}
      >
        {isDone && <Check className="h-6 w-6 animate-pop-in" strokeWidth={3.5} />}
      </span>
    </button>
  );
}
