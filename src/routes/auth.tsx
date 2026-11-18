import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BuddySays } from "@/components/buddy-scene";
import { GoogleG } from "@/components/brand-icons";
import { PageHeader } from "@/components/page-header";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — DermaLens" },
      { name: "description", content: "Create your DermaLens account or sign in to keep your skincare streak going." },
      { property: "og:title", content: "Sign in — DermaLens" },
      { property: "og:description", content: "Create your DermaLens account or sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/home`, data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/home", replace: true });
        else setSentTo(email);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Sign-in didn't work. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home", replace: true });
  }

  if (sentTo) {
    return (
      <main className="flex min-h-dvh flex-col px-6 pb-10">
        <PageHeader title="Almost there!" />
        <BuddySays mood="joy">
          I sent a confirmation link to <span className="text-accent">{sentTo}</span>. Tap it and come right back!
        </BuddySays>
        <Button variant="outline" className="mt-8" onClick={() => { setSentTo(null); setMode("signin"); }}>
          I confirmed, sign me in
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-10">
      <PageHeader title={mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Reset password"} />
      <BuddySays>
        {mode === "signup"
          ? "Save your quests, coins and skin checks so I can cheer you on every day!"
          : mode === "signin"
            ? "Yay, you're back! Let's keep that glow going."
            : "No worries! I'll email you a link to pick a new password."}
      </BuddySays>

      {mode !== "forgot" && (
        <div className="mt-6 flex flex-col gap-3">
          <Button type="button" variant="google" size="lg" onClick={() => social("google")}>
            <GoogleG />
            Continue with Google
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => social("lovable")}>
            <LovableMark className="size-[18px]" />
            Continue with Lovable
          </Button>
          <div className="my-2 flex items-center gap-3 text-sm font-bold text-muted-foreground">
            <span className="h-0.5 flex-1 bg-border" /> or with email <span className="h-0.5 flex-1 bg-border" />
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-4">
        {mode === "signup" && (
          <Field label="Your first name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="given-name" className="h-12 rounded-2xl border-2 bg-card text-base font-semibold" />
          </Field>
        )}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 rounded-2xl border-2 bg-card text-base font-semibold" />
        </Field>
        {mode !== "forgot" && (
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="h-12 rounded-2xl border-2 bg-card text-base font-semibold"
            />
          </Field>
        )}
        <Button type="submit" size="lg" disabled={busy} className="mt-2">
          {busy ? "One sec…" : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-base font-extrabold">
        {mode === "signin" && (
          <button type="button" className="min-h-11 text-muted-foreground" onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
        )}
        <button
          type="button"
          className="min-h-11 text-accent"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "I already have an account" : "New here? Create an account"}
        </button>
        <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/policies" search={{ tab: "terms" }} className="underline">Terms</Link> and{" "}
          <Link to="/policies" search={{ tab: "privacy" }} className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-extrabold">{label}</Label>
      {children}
    </div>
  );
}
