import type { Period } from "./dates";

export type QuestSeed = { period: Period; title: string; product: string; icon: string; position: number };

export function defaultQuests(skinType: string | null, concerns: string[]): QuestSeed[] {
  const cleanser =
    skinType === "Oily" || skinType === "Combination"
      ? "Gel cleanser"
      : skinType === "Dry"
        ? "Hydrating cleanser"
        : "Gentle cleanser";
  const nightTreatment = concerns.includes("Breakouts")
    ? "Niacinamide or BHA"
    : concerns.includes("Fine lines")
      ? "Gentle retinol"
      : "Hydrating serum";
  return [
    { period: "morning", title: "Wash your face", product: cleanser, icon: "drop", position: 0 },
    { period: "morning", title: "Glow serum", product: "Vitamin C serum", icon: "sparkle", position: 1 },
    { period: "morning", title: "Cozy moisturizer", product: "Moisturizer", icon: "jar", position: 2 },
    { period: "morning", title: "Sun shield", product: "Sunscreen SPF 30+", icon: "sun", position: 3 },
    { period: "evening", title: "Wash your face", product: cleanser, icon: "drop", position: 0 },
    { period: "evening", title: "Night treatment", product: nightTreatment, icon: "moon", position: 1 },
    { period: "evening", title: "Cozy moisturizer", product: "Moisturizer", icon: "jar", position: 2 },
  ];
}
