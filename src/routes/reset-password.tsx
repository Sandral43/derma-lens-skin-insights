import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuddySays } from "@/components/buddy-scene";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — DermaLens" },
      { name: "description", content: "Set a new password for your DermaLens account." },
      { property: "og:title", content: "Choose a new password — DermaLens" },
      { property: "og:description", content: "Set a new password for your DermaLens account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isRecovery = typeof window !== "undefined" && window.location.hash.includes("type=recovery");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated!");
    navigate({ to: "/home", replace: true });
  }

  return (
    <main className="min-h-dvh px-6 pb-10">
      <PageHeader title="New password" back={false} />
      <BuddySays>
        {isRecovery ? "Pick a fresh password and you're all set." : "Open the reset link from your email to choose a new password."}
      </BuddySays>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          type="password"
          placeholder="New password (8+ characters)"
          value={password}
          minLength={8}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-2xl border-2 bg-card text-base font-semibold"
        />
        <Button type="submit" size="lg" disabled={busy}>
          Save password
        </Button>
      </form>
    </main>
  );
}
