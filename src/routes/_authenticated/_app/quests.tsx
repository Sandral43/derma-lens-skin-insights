import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Bell, ChevronRight, Pencil, Sparkle, Trash2 } from "lucide-react";
import { BuddySays } from "@/components/buddy-scene";
import { QuestRow } from "@/components/quest-row";
import { QuestIcon } from "@/components/quest-icon";
import { QuestFormDialog, type QuestDraft } from "@/components/quest-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProgress } from "@/hooks/use-progress";
import { profileQuery, useAddQuest, useDeleteQuest, useUpdateProfile, useUpdateQuest, type Quest } from "@/lib/data";
import { currentPeriod, formatTime, type Period } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/quests")({
  validateSearch: z.object({ period: z.enum(["morning", "evening"]).optional() }),
  head: () => ({
    meta: [
      { title: "Quests — DermaLens" },
      { name: "description", content: "Your morning and evening skincare routine as quests." },
      { property: "og:title", content: "Quests — DermaLens" },
      { property: "og:description", content: "Your morning and evening skincare routine as quests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuestsPage,
});

function QuestsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/quests" });
  const period: Period = search.period ?? currentPeriod();
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { quests, doneToday, todayKey } = useProgress();
  const list = quests.filter((q) => q.period === period);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editQuest, setEditQuest] = useState<Quest | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const addQuest = useAddQuest();
  const updateQuest = useUpdateQuest();
  const deleteQuest = useDeleteQuest();

  const reminder = period === "morning" ? profile.morning_reminder : profile.evening_reminder;

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    const a = reordered[index]!;
    reordered[index] = reordered[target]!;
    reordered[target] = a;
    await Promise.all(
      reordered.map((q, idx) =>
        q.position === idx ? null : updateQuest.mutateAsync({ id: q.id, patch: { position: idx } }),
      ),
    );
  }

  function onAdd(d: QuestDraft) {
    addQuest.mutate(d, {
      onSuccess: () => {
        setAdding(false);
        toast.success("New quest added!");
        if (d.period !== period) navigate({ search: { period: d.period } });
      },
      onError: (e) => toast.error(e.message),
    });
  }

  function onEdit(d: QuestDraft) {
    if (!editQuest) return;
    updateQuest.mutate(
      { id: editQuest.id, patch: d },
      { onSuccess: () => setEditQuest(null), onError: (e) => toast.error(e.message) },
    );
  }

  return (
    <main className="px-5 pb-36">
      <header className="flex items-center justify-between pb-4 pt-6">
        <h1 className="text-[2.1rem] font-black">Quests</h1>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} aria-pressed={editing}>
          <Pencil /> {editing ? "Done" : "Edit"}
        </Button>
      </header>

      <div className="card-cozy grid grid-cols-2 gap-1 rounded-full p-1.5" role="tablist">
        {(["morning", "evening"] as const).map((p) => (
          <Link
            key={p}
            to="/quests"
            search={{ period: p }}
            replace
            role="tab"
            aria-selected={p === period}
            className={cn(
              "flex h-12 items-center justify-center rounded-full text-lg font-extrabold capitalize text-muted-foreground",
              p === period && "bg-primary text-foreground",
            )}
          >
            {p}
          </Link>
        ))}
      </div>

      <BuddySays className="mt-5">
        {editing ? "Move, rename or remove steps. Your coins stay safe!" : "Tap a step when you finish to earn coins!"}
      </BuddySays>

      <button
        type="button"
        onClick={() => setReminderOpen(true)}
        className="mt-4 flex min-h-11 items-center gap-2 font-extrabold text-muted-foreground"
      >
        <Bell className="h-5 w-5" />
        {profile.daily_reminders ? `Reminder at ${formatTime(reminder)}` : "Reminders are off"}
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="mt-3 flex flex-col gap-4">
        {list.map((q, i) =>
          editing ? (
            <div key={q.id} className="card-cozy flex items-center gap-3 px-4 py-3">
              <QuestIcon icon={q.icon} />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditQuest(q)}>
                <span className="block truncate text-lg font-black">{q.title}</span>
                <span className="block truncate font-semibold text-muted-foreground">{q.product || "Tap to edit"}</span>
              </button>
              <div className="flex">
                <Button variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${q.title}`}
                  onClick={() => deleteQuest.mutate(q.id, { onSuccess: () => toast(`Removed ${q.title}`) })}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          ) : (
            <QuestRow key={q.id} quest={q} done={doneToday.has(q.id)} dateKey={todayKey} />
          ),
        )}
        {list.length === 0 && (
          <p className="py-4 text-center font-bold text-muted-foreground">No {period} quests yet.</p>
        )}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-20 items-center justify-center rounded-[1.8rem] border-[3px] border-dashed border-lavender text-xl font-black text-accent"
        >
          + Add a quest
        </button>

        <Link
          to="/products"
          className="flex items-center gap-4 rounded-[1.8rem] border-2 border-primary/50 bg-primary-soft px-4 py-4"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary">
            <Sparkle className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-black">Recommended products</span>
            <span className="block font-semibold text-muted-foreground">Picked for your skin</span>
          </span>
          <ChevronRight className="h-6 w-6" />
        </Link>
      </div>

      <QuestFormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add a quest"
        submitLabel="Add quest"
        busy={addQuest.isPending}
        initial={{ period, title: "", product: "", icon: "sparkle" }}
        onSubmit={onAdd}
      />
      <QuestFormDialog
        open={!!editQuest}
        onOpenChange={(o) => !o && setEditQuest(null)}
        title="Edit quest"
        submitLabel="Save"
        busy={updateQuest.isPending}
        initial={
          editQuest
            ? { period: editQuest.period as Period, title: editQuest.title, product: editQuest.product, icon: editQuest.icon }
            : { period, title: "", product: "", icon: "sparkle" }
        }
        onSubmit={onEdit}
      />
      <ReminderDialog open={reminderOpen} onOpenChange={setReminderOpen} />
    </main>
  );
}

function ReminderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const update = useUpdateProfile();
  const [morning, setMorning] = useState(profile.morning_reminder.slice(0, 5));
  const [evening, setEvening] = useState(profile.evening_reminder.slice(0, 5));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reminder times</DialogTitle>
          <DialogDescription className="font-semibold">
            {profile.pet_name} will nudge you at these times while DermaLens is open.
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center justify-between gap-4 font-extrabold">
          Morning
          <Input type="time" value={morning} onChange={(e) => setMorning(e.target.value)} className="h-12 w-36 rounded-2xl border-2 bg-card font-bold" />
        </label>
        <label className="flex items-center justify-between gap-4 font-extrabold">
          Evening
          <Input type="time" value={evening} onChange={(e) => setEvening(e.target.value)} className="h-12 w-36 rounded-2xl border-2 bg-card font-bold" />
        </label>
        <Button
          size="lg"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { morning_reminder: morning, evening_reminder: evening, daily_reminders: true },
              { onSuccess: () => { toast.success("Reminders saved"); onOpenChange(false); } },
            )
          }
        >
          Save reminders
        </Button>
      </DialogContent>
    </Dialog>
  );
}
