import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUEST_ICONS, QuestIcon } from "@/components/quest-icon";
import type { Period } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type QuestDraft = { period: Period; title: string; product: string; icon: string };

export function QuestFormDialog({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: QuestDraft;
  title: string;
  submitLabel: string;
  onSubmit: (d: QuestDraft) => void;
  busy?: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    if (open) setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSubmit({ ...draft, title: draft.title.trim(), product: draft.product.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="font-semibold">Give your step a fun name and pick an icon.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-full border-2 border-border bg-card p-1">
            {(["morning", "evening"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDraft({ ...draft, period: p })}
                className={cn(
                  "h-11 rounded-full font-extrabold capitalize text-muted-foreground",
                  draft.period === p && "bg-primary text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-extrabold">Quest name</Label>
            <Input
              value={draft.title}
              maxLength={40}
              required
              placeholder="e.g. Gentle exfoliant"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="h-12 rounded-2xl border-2 bg-card text-base font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-extrabold">Product (optional)</Label>
            <Input
              value={draft.product}
              maxLength={60}
              placeholder="e.g. BHA toner"
              onChange={(e) => setDraft({ ...draft, product: e.target.value })}
              className="h-12 rounded-2xl border-2 bg-card text-base font-semibold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-extrabold">Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(QUEST_ICONS).map(([key, v]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={v.label}
                  aria-pressed={draft.icon === key}
                  onClick={() => setDraft({ ...draft, icon: key })}
                  className={cn(
                    "flex items-center justify-center rounded-full border-[3px] border-transparent p-0.5",
                    draft.icon === key && "border-foreground",
                  )}
                >
                  <QuestIcon icon={key} className="h-12 w-12" />
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" disabled={busy}>
            {submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
