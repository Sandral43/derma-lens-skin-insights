import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Chick } from "@/components/chick";
import { SurveyStep } from "@/components/survey-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileQuery, questsQuery } from "@/lib/data";
import { defaultQuests } from "@/lib/default-quests";
import { SURVEY, type SurveyAnswers } from "@/lib/survey";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  head: () => ({
    meta: [
      { title: "Get to know your skin — DermaLens" },
      { name: "description", content: "Answer a few quick questions so your buddy can build your routine." },
      { property: "og:title", content: "Get to know your skin — DermaLens" },
      { property: "og:description", content: "A quick skin survey to set up your routine." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const TOTAL = SURVEY.length + 1;

function Onboarding() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({
    skin_type: profile.skin_type,
    concerns: profile.concerns,
    sensitivity: profile.sensitivity,
    routine_level: profile.routine_level,
    avoid_ingredients: profile.avoid_ingredients,
  });
  const [petName, setPetName] = useState(profile.pet_name === "Sunny" ? "" : profile.pet_name);
  const [saving, setSaving] = useState(false);

  const isPetStep = step === SURVEY.length;
  const q = SURVEY[step];

  function next() {
    if (step < TOTAL - 1) setStep(step + 1);
    else finish();
  }

  async function finish() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ...answers, pet_name: petName.trim() || "Sunny", onboarded: true })
        .eq("id", profile.id);
      if (error) throw error;
      const { count } = await supabase.from("quests").select("id", { count: "exact", head: true });
      if (!count) {
        const { error: qErr } = await supabase
          .from("quests")
          .insert(defaultQuests(answers.skin_type, answers.concerns));
        if (qErr) throw qErr;
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: profileQuery.queryKey }),
        qc.invalidateQueries({ queryKey: questsQuery.queryKey }),
      ]);
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  }

  const currentValue = q ? answers[q.key] : null;
  const canContinue = isPetStep || (Array.isArray(currentValue) ? currentValue.length > 0 : !!currentValue);

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8">
      <div className="flex items-center gap-3 pb-6 pt-6">
        <button
          type="button"
          aria-label="Back"
          onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.6} />
        </button>
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={cn("h-2.5 flex-1 rounded-full", i <= step ? "bg-success" : "bg-muted")} />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          disabled={saving}
          className="flex min-h-11 items-center px-2 text-base font-extrabold text-muted-foreground"
        >
          Skip
        </button>
      </div>

      {isPetStep ? (
        <div className="flex flex-col items-center">
          <h1 className="text-center text-3xl font-black">Name your new buddy</h1>
          <Chick className="my-8 w-52 animate-bob" mood="joy" />
          <Input
            aria-label="Buddy name"
            value={petName}
            maxLength={20}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Sunny"
            className="h-16 rounded-[1.6rem] border-2 bg-card text-center text-2xl font-black"
          />
          <p className="mt-4 font-semibold text-muted-foreground">You can change this later in Settings.</p>
        </div>
      ) : q ? (
        <SurveyStep
          question={q}
          value={currentValue}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
        />
      ) : null}

      <div className="mt-auto pt-8">
        <Button size="lg" onClick={next} disabled={saving || !canContinue}>
          {isPetStep ? (saving ? "Getting cozy…" : "Meet my buddy") : "Continue"}
        </Button>
      </div>
    </main>
  );
}
