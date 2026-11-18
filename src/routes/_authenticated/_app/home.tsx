import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Flame, MessageCircle, Settings, Sparkle } from "lucide-react";
import { BuddyScene } from "@/components/buddy-scene";
import { QuestRow } from "@/components/quest-row";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/use-progress";
import { profileQuery } from "@/lib/data";
import { currentPeriod, greetingFor } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — DermaLens" },
      { name: "description", content: "Your streak, coins and today's skincare quests." },
      { property: "og:title", content: "Home — DermaLens" },
      { property: "og:description", content: "Your streak, coins and today's skincare quests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { quests, doneToday, todayKey, streak, coins, counts, doneMorning, doneEvening } = useProgress();
  const period = currentPeriod();
  const today = quests.filter((q) => q.period === period);
  const name = profile.display_name?.split(" ")[0] || "friend";
  const doneNow = period === "morning" ? doneMorning : doneEvening;
  const allDone = counts[period] > 0 && doneNow >= counts[period];

  const message = !profile.pet_messages
    ? `${greetingFor()}, ${name}!`
    : allDone
      ? `You did it, ${name}! Your ${period} glow is complete.`
      : doneNow > 0
        ? `Nice going, ${name}! ${counts[period] - doneNow} to go.`
        : `${greetingFor()}, ${name}! Ready to glow?`;

  return (
    <main className="px-5 pb-36 pt-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 items-center gap-2 rounded-full bg-blush px-4 font-black">
          <Flame className="h-5 w-5" aria-hidden /> {streak} day streak
        </span>
        <span className="flex h-12 items-center gap-2 rounded-full bg-butter px-4 font-black">
          <Sparkle className="h-5 w-5" aria-hidden /> {coins} coins
        </span>
        <Link
          to="/settings"
          aria-label="Settings"
          className="ml-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card"
        >
          <Settings className="h-6 w-6" />
        </Link>
      </div>

      <BuddyScene className="mt-5 h-80" chickClassName="mt-8 w-36" message={message} mood={allDone ? "joy" : "happy"}>
        <Button asChild className="absolute bottom-5 right-5 z-20 h-14 px-6 text-lg">
          <Link to="/chat">
            <MessageCircle /> Ask me
          </Link>
        </Button>
      </BuddyScene>

      <div className="mb-4 mt-8 flex items-end justify-between">
        <h2 className="text-2xl font-black">
          Today's {period} quests
        </h2>
        <Link to="/quests" search={{ period }} className="flex min-h-11 items-end font-extrabold text-accent underline underline-offset-4">
          See all
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {today.map((q) => (
          <QuestRow key={q.id} quest={q} done={doneToday.has(q.id)} dateKey={todayKey} />
        ))}
        {today.length === 0 && (
          <Link to="/quests" search={{ period }} className="card-cozy p-6 text-center font-extrabold text-accent">
            + Add your first {period} quest
          </Link>
        )}
      </div>
    </main>
  );
}
