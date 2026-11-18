import { addDays, type Period } from "./dates";

export type CompletionLite = {
  completed_on: string;
  period: Period;
  reward: number;
  quest_id: string | null;
};

export type QuestCounts = Record<Period, number>;

export function totalCoins(completions: CompletionLite[]): number {
  return completions.reduce((sum, c) => sum + c.reward, 0);
}

export function doneCount(dateKey: string, period: Period, completions: CompletionLite[]): number {
  return new Set(
    completions
      .filter((c) => c.completed_on === dateKey && c.period === period)
      .map((c) => c.quest_id ?? `${c.completed_on}-${Math.random()}`),
  ).size;
}

/**
 * A day counts as "routine done" when every current quest of the morning routine,
 * or every current quest of the evening routine, was checked off that day.
 */
export function isDayDone(dateKey: string, completions: CompletionLite[], counts: QuestCounts): boolean {
  return (["morning", "evening"] as const).some(
    (p) => counts[p] > 0 && doneCount(dateKey, p, completions) >= counts[p],
  );
}

/**
 * Forgiving streak: counts routine-done days in a row.
 * - Today not finished yet never breaks the streak.
 * - Missing a single day pauses the streak (it is not counted, but the streak survives).
 * - Missing two days in a row resets it.
 */
export function computeStreak(todayKey: string, completions: CompletionLite[], counts: QuestCounts): number {
  let streak = 0;
  let misses = 0;
  let cursor = isDayDone(todayKey, completions, counts) ? todayKey : addDays(todayKey, -1);
  for (let i = 0; i < 400; i++) {
    if (isDayDone(cursor, completions, counts)) {
      streak++;
      misses = 0;
    } else {
      misses++;
      if (misses >= 2) break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}
