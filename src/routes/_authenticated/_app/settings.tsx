import { useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMyAccount, deleteMyPhotos } from "@/lib/account.functions";
import { downloadJson, exportMyData, profileQuery, useUpdateProfile } from "@/lib/data";
import { SURVEY, type SurveyQuestion } from "@/lib/survey";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DermaLens" },
      { name: "description", content: "Manage your account, skin profile, reminders, buddy and privacy." },
      { property: "og:title", content: "Settings — DermaLens" },
      { property: "og:description", content: "Manage your DermaLens account and privacy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

type DialogKind = null | "name" | "skin" | "plan" | "password" | "devices" | "pet" | "photos" | "delete";

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { user } = Route.useRouteContext();
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState<DialogKind>(null);
  const isEmailUser = user.app_metadata?.provider === "email";

  async function signOut(scope: "local" | "global" = "local") {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope });
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  async function download() {
    try {
      downloadJson("dermalens-my-data.json", await exportMyData());
      toast.success("Your data is downloading.");
    } catch {
      toast.error("Couldn't prepare your data. Try again.");
    }
  }

  const name = profile.display_name || "You";

  return (
    <main className="px-5 pb-16">
      <PageHeader title="Settings" />

      <section className="card-cozy flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blush text-2xl font-black">
          {name[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-black">{name}</p>
          <p className="truncate font-semibold text-muted-foreground">{user.email}</p>
        </div>
        <Button size="sm" onClick={() => setOpen("name")}>
          Edit
        </Button>
      </section>

      <Group title="Account">
        <Row label="Skin profile" value={profile.skin_type ?? "Add"} onClick={() => setOpen("skin")} />
        <Row label="Subscription" value="Free" onClick={() => setOpen("plan")} />
        <Row label="Change password" onClick={() => setOpen("password")} />
        <Row label="Connected devices" onClick={() => setOpen("devices")} />
      </Group>

      <Group title="Preferences">
        <ToggleRow
          label="Daily reminders"
          checked={profile.daily_reminders}
          onChange={(v) => update.mutate({ daily_reminders: v })}
        />
        <ToggleRow
          label={`Messages from ${profile.pet_name}`}
          checked={profile.pet_messages}
          onChange={(v) => update.mutate({ pet_messages: v })}
        />
        <ToggleRow
          label={`Share my skin profile with ${profile.pet_name}`}
          hint="Lets chat answers fit your skin and routine."
          checked={profile.share_profile_with_pet}
          onChange={(v) => update.mutate({ share_profile_with_pet: v })}
        />
        <Row label="Pet name" value={profile.pet_name} onClick={() => setOpen("pet")} />
      </Group>

      <Group title="Privacy and policies">
        <Row label="Privacy policy" to="privacy" />
        <Row label="Terms of service" to="terms" />
        <Row label="How your data is used" to="data" />
        <Row label="Skin photo storage" value={profile.save_scan_photos ? "On" : "Off"} onClick={() => setOpen("photos")} />
        <Row label="Download my data" onClick={download} />
      </Group>

      <Group title="Session">
        <Row label="Log out" onClick={() => signOut()} />
        <Row label="Delete account" danger onClick={() => setOpen("delete")} />
      </Group>

      <NameDialog open={open === "name"} onClose={() => setOpen(null)} />
      <SkinDialog open={open === "skin"} onClose={() => setOpen(null)} />
      <PetDialog open={open === "pet"} onClose={() => setOpen(null)} />
      <PasswordDialog open={open === "password"} onClose={() => setOpen(null)} isEmailUser={isEmailUser} />
      <PhotosDialog open={open === "photos"} onClose={() => setOpen(null)} />
      <Dialog open={open === "plan"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription</DialogTitle>
            <DialogDescription className="font-semibold">
              You're on the Free plan. Every feature is included while DermaLens is in early access.
            </DialogDescription>
          </DialogHeader>
          <Button size="lg" onClick={() => setOpen(null)}>Sounds good</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={open === "devices"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connected devices</DialogTitle>
            <DialogDescription className="font-semibold">
              You're signed in on this device. If you've used DermaLens somewhere else, you can sign out everywhere at once.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" size="lg" onClick={() => signOut("global")}>Sign out of all devices</Button>
        </DialogContent>
      </Dialog>
      <DeleteDialog open={open === "delete"} onClose={() => setOpen(null)} onDeleted={() => signOut()} />
    </main>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 px-1 text-sm font-black uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="card-cozy divide-y-2 divide-border overflow-hidden">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  onClick,
  to,
  danger,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  to?: "privacy" | "terms" | "data";
  danger?: boolean;
}) {
  const inner = (
    <>
      <span className={cn("flex-1 text-lg font-extrabold", danger && "text-destructive")}>{label}</span>
      {value && <span className="max-w-[40%] truncate font-semibold text-muted-foreground">{value}</span>}
      <ChevronRight className="h-5 w-5 shrink-0" />
    </>
  );
  const cls = "flex min-h-16 w-full items-center gap-3 px-5 text-left hover:bg-muted/40";
  if (to)
    return (
      <Link to="/policies" search={{ tab: to }} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-3 px-5 py-3">
      <span className="flex-1">
        <span className="block text-lg font-extrabold">{label}</span>
        {hint && <span className="block text-sm font-semibold text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function NameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const update = useUpdateProfile();
  const [value, setValue] = useState(profile.display_name ?? "");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your name</DialogTitle>
          <DialogDescription className="font-semibold">This is what your buddy calls you.</DialogDescription>
        </DialogHeader>
        <Input value={value} maxLength={40} onChange={(e) => setValue(e.target.value)} className="h-12 rounded-2xl border-2 bg-card text-base font-bold" />
        <Button size="lg" disabled={!value.trim()} onClick={() => update.mutate({ display_name: value.trim() }, { onSuccess: onClose })}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const update = useUpdateProfile();
  const [value, setValue] = useState(profile.pet_name);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename your buddy</DialogTitle>
        </DialogHeader>
        <Input value={value} maxLength={20} onChange={(e) => setValue(e.target.value)} className="h-14 rounded-2xl border-2 bg-card text-center text-xl font-black" />
        <Button
          size="lg"
          disabled={!value.trim()}
          onClick={() =>
            update.mutate({ pet_name: value.trim() }, { onSuccess: () => { toast.success(`Hi, I'm ${value.trim()}!`); onClose(); } })
          }
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function SkinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const update = useUpdateProfile();
  const [answers, setAnswers] = useState({
    skin_type: profile.skin_type,
    concerns: profile.concerns,
    sensitivity: profile.sensitivity,
    routine_level: profile.routine_level,
    avoid_ingredients: profile.avoid_ingredients,
  });

  function toggle(q: SurveyQuestion, v: string) {
    if (q.kind === "single") return setAnswers((a) => ({ ...a, [q.key]: a[q.key] === v ? null : v }));
    setAnswers((a) => {
      const cur = a[q.key];
      if (q.noneValue && v === q.noneValue) return { ...a, [q.key]: cur.includes(v) ? [] : [v] };
      const base = cur.filter((s) => s !== q.noneValue);
      return { ...a, [q.key]: base.includes(v) ? base.filter((s) => s !== v) : [...base, v] };
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skin profile</DialogTitle>
          <DialogDescription className="font-semibold">Update anything you skipped or that's changed.</DialogDescription>
        </DialogHeader>
        {SURVEY.map((q) => (
          <div key={q.key}>
            <p className="mb-2 font-black">{q.question}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const val = answers[q.key];
                const on = Array.isArray(val) ? val.includes(o.value) : val === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(q, o.value)}
                    className={cn(
                      "min-h-10 rounded-full border-2 px-4 text-sm font-extrabold",
                      on ? "border-primary-deep/60 bg-primary" : "border-border bg-card",
                    )}
                  >
                    {q.key === "skin_type" ? o.value : o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Button size="lg" disabled={update.isPending} onClick={() => update.mutate(answers, { onSuccess: () => { toast.success("Skin profile saved"); onClose(); } })}>
          Save profile
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ open, onClose, isEmailUser }: { open: boolean; onClose: () => void; isEmailUser: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as { password: string });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password changed");
    setCurrent("");
    setNext("");
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          {!isEmailUser && (
            <DialogDescription className="font-semibold">
              You signed in with Google or Lovable, so your password is managed there.
            </DialogDescription>
          )}
        </DialogHeader>
        {isEmailUser && (
          <>
            <Input type="password" placeholder="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-12 rounded-2xl border-2 bg-card font-semibold" />
            <Input type="password" placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} className="h-12 rounded-2xl border-2 bg-card font-semibold" />
            <Button size="lg" disabled={busy || next.length < 8 || !current} onClick={save}>
              Update password
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PhotosDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const update = useUpdateProfile();
  const removePhotos = useServerFn(deleteMyPhotos);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skin photo storage</DialogTitle>
          <DialogDescription className="font-semibold">
            When on, scan photos are saved to a private folder only you can open, and show on your Calendar. When off,
            only your scores are kept.
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center justify-between gap-3 rounded-3xl border-2 border-border bg-card p-4 text-lg font-extrabold">
          Save scan photos
          <Switch checked={profile.save_scan_photos} onCheckedChange={(v) => update.mutate({ save_scan_photos: v })} />
        </label>
        <Button
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await removePhotos();
            setBusy(false);
            await qc.invalidateQueries({ queryKey: ["scans"] });
            toast.success(r.removed ? `Deleted ${r.removed} photo${r.removed === 1 ? "" : "s"}` : "No saved photos to delete");
          }}
        >
          Delete all saved photos
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const del = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription className="font-semibold">
            This permanently removes your profile, quests, coins, skin checks and photos. It can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my account</AlertDialogCancel>
          <AlertDialogAction
            className="border-destructive bg-destructive text-destructive-foreground"
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await del();
              setBusy(false);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast("Your account was deleted. Take care!");
              onDeleted();
            }}
          >
            {busy ? "Deleting…" : "Delete forever"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
