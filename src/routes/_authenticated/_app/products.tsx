import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { BuddySays } from "@/components/buddy-scene";
import { PageHeader } from "@/components/page-header";
import { QuestIcon } from "@/components/quest-icon";
import { Button } from "@/components/ui/button";
import { profileQuery, questsQuery, savedProductsQuery, useAddQuest, useToggleSaved, useUpdateQuest } from "@/lib/data";
import { currentPeriod } from "@/lib/dates";
import { CATEGORY_ICON, CATEGORY_QUEST_TITLE, rankProducts, type ProductCategory, type RankedProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/products")({
  loader: ({ context }) => context.queryClient.ensureQueryData(savedProductsQuery),
  head: () => ({
    meta: [
      { title: "Recommended for you — DermaLens" },
      { name: "description", content: "Cleansers, serums, moisturizers and sunscreens picked for your skin profile." },
      { property: "og:title", content: "Recommended for you — DermaLens" },
      { property: "og:description", content: "Skincare product ideas that match your skin profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsPage,
});

const FILTERS: ("All" | ProductCategory | "Saved")[] = ["All", "Cleanser", "Serum", "Moisturizer", "SPF", "Saved"];

function ProductsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: quests } = useSuspenseQuery(questsQuery);
  const { data: saved } = useSuspenseQuery(savedProductsQuery);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const ranked = useMemo(() => {
    const all = rankProducts(profile, quests.map((q) => `${q.title} ${q.product}`));
    if (filter === "Saved") return all.filter((p) => saved.includes(p.id));
    if (filter === "All") {
      // Best two per category, so "All" stays a short, balanced list.
      const per = new Map<string, number>();
      return all.filter((p) => {
        const n = per.get(p.category) ?? 0;
        per.set(p.category, n + 1);
        return n < 2;
      });
    }
    return all.filter((p) => p.category === filter);
  }, [profile, quests, saved, filter]);

  return (
    <main className="pb-36">
      <div className="px-5">
        <PageHeader title="Recommended for you" />
        <BuddySays>I picked these to match your skin profile!</BuddySays>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none]" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "h-12 shrink-0 rounded-full border-2 px-5 text-base font-extrabold",
              filter === f ? "border-primary-deep/50 bg-primary" : "border-border bg-card",
            )}
          >
            {f === "SPF" ? "Sunscreen" : f}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-5 px-5">
        {ranked.map((p) => (
          <ProductCard key={p.id} product={p} saved={saved.includes(p.id)} />
        ))}
        {ranked.length === 0 && (
          <p className="py-8 text-center font-bold text-muted-foreground">
            {filter === "Saved" ? "Tap the heart on a product to save it here." : "Nothing here yet."}
          </p>
        )}
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Suggestions only, not medical advice. Nothing here is sponsored. Prices are approximate.
        </p>
      </div>
    </main>
  );
}

function ProductCard({ product, saved }: { product: RankedProduct; saved: boolean }) {
  const { data: quests } = useSuspenseQuery(questsQuery);
  const addQuest = useAddQuest();
  const updateQuest = useUpdateQuest();
  const toggleSaved = useToggleSaved();
  const label = `${product.brand} ${product.name}`;
  const inRoutine = quests.some((q) => q.product === label);

  function addToQuests() {
    const period = product.period === "both" ? currentPeriod() : product.period;
    const existing = quests.find((q) => q.period === period && q.icon === CATEGORY_ICON[product.category]);
    if (existing) {
      updateQuest.mutate(
        { id: existing.id, patch: { product: label } },
        { onSuccess: () => toast.success(`Updated your ${period} “${existing.title}” quest`) },
      );
    } else {
      addQuest.mutate(
        { period, title: CATEGORY_QUEST_TITLE[product.category], product: label, icon: CATEGORY_ICON[product.category] },
        { onSuccess: () => toast.success(`Added to your ${period} quests`) },
      );
    }
  }

  return (
    <article className="card-cozy p-5">
      <div className="flex gap-4">
        <QuestIcon icon={CATEGORY_ICON[product.category]} size="lg" />
        <div className="min-w-0">
          <p className="font-extrabold text-muted-foreground">{product.category === "SPF" ? "Sunscreen SPF" : product.category}</p>
          <h2 className="text-xl font-black leading-tight">{product.name}</h2>
          <p className="font-semibold text-muted-foreground">
            {product.brand} · {product.price}
          </p>
        </div>
      </div>
      <p className="mt-4 font-semibold">{product.reason}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{product.blurb}</p>
      <div className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={addToQuests} disabled={inRoutine || addQuest.isPending || updateQuest.isPending}>
          {inRoutine ? "In your quests" : "Add to quests"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-14"
          aria-label={saved ? `Unsave ${product.name}` : `Save ${product.name}`}
          aria-pressed={saved}
          onClick={() => toggleSaved.mutate({ productId: product.id, saved: !saved })}
        >
          <Heart className={cn(saved && "fill-destructive text-destructive")} />
        </Button>
      </div>
    </article>
  );
}
