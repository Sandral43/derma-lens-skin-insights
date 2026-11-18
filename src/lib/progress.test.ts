import { describe, expect, it } from "vitest";
import { computeStreak, isDayDone, totalCoins, type CompletionLite } from "./progress";

const counts = { morning: 2, evening: 1 };
function full(day: string): CompletionLite[] {
  return [
    { completed_on: day, period: "morning", reward: 5, quest_id: "m1" },
    { completed_on: day, period: "morning", reward: 5, quest_id: "m2" },
  ];
}

describe("progress rules", () => {
  it("a day is done when the whole morning routine is checked off", () => {
    expect(isDayDone("2026-11-10", full("2026-11-10"), counts)).toBe(true);
  });

  it("a day with only part of a routine is not done", () => {
    expect(isDayDone("2026-11-10", full("2026-11-10").slice(0, 1), counts)).toBe(false);
  });

  it("coins add up the reward of each checked quest", () => {
    expect(totalCoins([...full("2026-11-09"), ...full("2026-11-10")])).toBe(20);
  });

  it("today not finished yet does not break the streak", () => {
    const c = [...full("2026-11-08"), ...full("2026-11-09")];
    expect(computeStreak("2026-11-10", c, counts)).toBe(2);
  });

  it("missing one day pauses the streak instead of resetting it", () => {
    const c = [...full("2026-11-06"), ...full("2026-11-07"), ...full("2026-11-09"), ...full("2026-11-10")];
    expect(computeStreak("2026-11-10", c, counts)).toBe(4);
  });

  it("missing two days in a row resets the streak", () => {
    const c = [...full("2026-11-05"), ...full("2026-11-06"), ...full("2026-11-09"), ...full("2026-11-10")];
    expect(computeStreak("2026-11-10", c, counts)).toBe(2);
  });
});
