import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { coinsQuery, questsQuery, recentCompletionsQuery } from "@/lib/data";
import { toDateKey } from "@/lib/dates";
import { computeStreak, doneCount, type CompletionLite } from "@/lib/progress";

export function useProgress() {
  const { data: quests } = useSuspenseQuery(questsQuery);
  const { data: completions } = useSuspenseQuery(recentCompletionsQuery());
  const { data: coins } = useSuspenseQuery(coinsQuery);
  const todayKey = toDateKey(new Date());

  return useMemo(() => {
    const counts = {
      morning: quests.filter((q) => q.period === "morning").length,
      evening: quests.filter((q) => q.period === "evening").length,
    };
    const lite = completions as CompletionLite[];
    const doneToday = new Set(completions.filter((c) => c.completed_on === todayKey).map((c) => c.quest_id));
    return {
      quests,
      completions,
      coins,
      counts,
      todayKey,
      doneToday,
      streak: computeStreak(todayKey, lite, counts),
      doneMorning: doneCount(todayKey, "morning", lite),
      doneEvening: doneCount(todayKey, "evening", lite),
    };
  }, [quests, completions, coins, todayKey]);
}
