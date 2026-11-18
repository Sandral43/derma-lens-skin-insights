import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Chick } from "@/components/chick";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { POLICIES, POLICY_UPDATED, SUPPORT_EMAIL, type PolicyTab } from "@/lib/policies";
import { downloadJson, exportMyData } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/policies")({
  validateSearch: z.object({ tab: z.enum(["privacy", "terms", "data"]).optional() }),
  head: () => ({
    meta: [
      { title: "Privacy, Terms & Data use — DermaLens" },
      {
        name: "description",
        content: "How DermaLens handles your skin photos, routine data and chats, in plain language.",
      },
      { property: "og:title", content: "Privacy, Terms & Data use — DermaLens" },
      { property: "og:description", content: "Plain-language policies for DermaLens, the skincare buddy app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const { tab = "privacy" } = Route.useSearch();
  const policy = POLICIES[tab];
  const [open, setOpen] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  useEffect(() => setOpen(0), [tab]);

  async function download() {
    try {
      downloadJson("dermalens-my-data.json", await exportMyData());
      toast.success("Your data is downloading.");
    } catch {
      toast.error("Please sign in to download your data.");
    }
  }

  return (
    <main className="px-5 pb-12">
      <PageHeader title="Policies" />
      <p className="-mt-2 mb-4 text-sm font-bold text-muted-foreground">
        Last updated {POLICY_UPDATED} · Draft, pending legal review
      </p>

      <div role="tablist" className="card-cozy grid grid-cols-3 gap-1 rounded-full p-1.5">
        {(Object.keys(POLICIES) as PolicyTab[]).map((t) => (
          <Link
            key={t}
            to="/policies"
            search={{ tab: t }}
            replace
            role="tab"
            aria-selected={t === tab}
            className={cn(
              "flex h-11 items-center justify-center rounded-full text-base font-extrabold text-muted-foreground",
              t === tab && "bg-primary text-primary-foreground",
            )}
          >
            {POLICIES[t].label}
          </Link>
        ))}
      </div>

      <section className="mt-5 flex items-center gap-4 rounded-[2rem] border-2 border-primary/40 bg-primary-soft p-5">
        <Chick className="w-16 shrink-0" />
        <div>
          <h2 className="text-lg font-black">The short version</h2>
          <p className="mt-1 font-semibold text-muted-foreground">{policy.short}</p>
        </div>
      </section>

      <section className="card-cozy mt-5 overflow-hidden">
        {policy.sections.map((s, i) => (
          <div key={s.title} className={cn(i > 0 && "border-t-2 border-border")}>
            <button
              type="button"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex min-h-16 w-full items-center justify-between px-5 text-left text-lg font-extrabold"
            >
              {s.title}
              <ChevronDown className={cn("h-6 w-6 shrink-0 transition-transform", open !== i && "-rotate-90")} />
            </button>
            {open === i && (
              <div className="space-y-2 px-5 pb-5 font-semibold text-muted-foreground">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="mt-6 flex flex-col gap-3">
        {signedIn && (
          <Button size="lg" onClick={download}>
            Download my data
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
        </Button>
      </div>
    </main>
  );
}
