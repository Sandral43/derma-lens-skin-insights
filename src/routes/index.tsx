import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BuddyScene } from "@/components/buddy-scene";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DermaLens — Skincare, but make it fun" },
      {
        name: "description",
        content:
          "Meet your skincare buddy. DermaLens turns your routine into daily quests, tracks your skin with face scans and answers questions in a friendly chat.",
      },
      { property: "og:title", content: "DermaLens — Skincare, but make it fun" },
      {
        property: "og:description",
        content: "Daily skincare quests, face scans and a friendly AI buddy that keeps you glowing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-8 pt-8">
      <BuddyScene
        className="h-[48dvh] min-h-[320px]"
        chickClassName="w-48 mt-[10%]"
        message="Hi! I'm your new skincare buddy. Let's get to know your skin!"
      />
      <div className="mt-8 text-center">
        <h1 className="text-5xl font-black">DermaLens</h1>
        <p className="mt-3 text-xl font-semibold text-muted-foreground">Skincare, but make it fun</p>
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 pt-10">
        <Button asChild size="lg">
          <Link to="/auth" search={{ mode: "signup" }}>
            Get started
          </Link>
        </Button>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="flex min-h-11 items-center text-lg font-extrabold text-accent"
        >
          I already have an account
        </Link>
        <p className="text-center text-sm font-semibold text-muted-foreground">
          By continuing you agree to the{" "}
          <Link to="/policies" search={{ tab: "terms" }} className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/policies" search={{ tab: "privacy" }} className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
