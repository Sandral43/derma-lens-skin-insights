export type ProductCategory = "Cleanser" | "Serum" | "Moisturizer" | "SPF";

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  brand: string;
  price: string;
  skinTypes: string[]; // empty = all
  concerns: string[];
  period: "morning" | "evening" | "both";
  fragranceFree: boolean;
  gentle: boolean;
  blurb: string;
};

export const CATEGORY_ICON: Record<ProductCategory, string> = {
  Cleanser: "drop",
  Serum: "sparkle",
  Moisturizer: "jar",
  SPF: "sun",
};

export const CATEGORY_QUEST_TITLE: Record<ProductCategory, string> = {
  Cleanser: "Wash your face",
  Serum: "Glow serum",
  Moisturizer: "Cozy moisturizer",
  SPF: "Sun shield",
};

/** Sample catalog with approximate US prices. Not sponsored, no affiliate links. */
export const PRODUCTS: Product[] = [
  { id: "cerave-hydrating-cleanser", category: "Cleanser", name: "Hydrating Facial Cleanser", brand: "CeraVe", price: "~$17", skinTypes: ["Dry", "Normal"], concerns: ["Dryness", "Redness"], period: "both", fragranceFree: true, gentle: true, blurb: "Creamy wash with ceramides that won't strip your skin." },
  { id: "lrp-toleriane-cleanser", category: "Cleanser", name: "Toleriane Hydrating Gentle Cleanser", brand: "La Roche-Posay", price: "~$18", skinTypes: ["Dry", "Normal", "Not sure"], concerns: ["Redness", "Dryness"], period: "both", fragranceFree: true, gentle: true, blurb: "Extra gentle, made with sensitive skin in mind." },
  { id: "cerave-foaming-cleanser", category: "Cleanser", name: "Foaming Facial Cleanser", brand: "CeraVe", price: "~$17", skinTypes: ["Oily", "Combination"], concerns: ["Breakouts"], period: "both", fragranceFree: true, gentle: true, blurb: "Light foam that lifts oil while keeping your barrier comfy." },
  { id: "vanicream-cleanser", category: "Cleanser", name: "Gentle Facial Cleanser", brand: "Vanicream", price: "~$10", skinTypes: [], concerns: ["Redness"], period: "both", fragranceFree: true, gentle: true, blurb: "Simple formula with very few common irritants." },

  { id: "to-niacinamide", category: "Serum", name: "Niacinamide 10% + Zinc 1%", brand: "The Ordinary", price: "~$7", skinTypes: ["Oily", "Combination", "Normal"], concerns: ["Breakouts", "Dullness"], period: "both", fragranceFree: true, gentle: false, blurb: "Helps with shine and the look of pores." },
  { id: "to-hyaluronic", category: "Serum", name: "Hyaluronic Acid 2% + B5", brand: "The Ordinary", price: "~$10", skinTypes: [], concerns: ["Dryness", "Fine lines"], period: "both", fragranceFree: true, gentle: true, blurb: "A drink of water for thirsty skin." },
  { id: "timeless-vitc", category: "Serum", name: "20% Vitamin C + E Ferulic Acid", brand: "Timeless", price: "~$30", skinTypes: ["Normal", "Oily", "Combination", "Dry"], concerns: ["Dark spots", "Dullness", "Sun protection"], period: "morning", fragranceFree: true, gentle: false, blurb: "Brightening antioxidant that pairs well with sunscreen." },
  { id: "to-azelaic", category: "Serum", name: "Azelaic Acid Suspension 10%", brand: "The Ordinary", price: "~$11", skinTypes: [], concerns: ["Redness", "Dark spots", "Breakouts"], period: "evening", fragranceFree: true, gentle: true, blurb: "Evens out tone and calms the look of redness." },
  { id: "lrp-retinol-b3", category: "Serum", name: "Retinol B3 Serum", brand: "La Roche-Posay", price: "~$45", skinTypes: ["Normal", "Oily", "Combination"], concerns: ["Fine lines", "Dark spots"], period: "evening", fragranceFree: true, gentle: false, blurb: "Beginner-friendly retinol for smoother-looking skin." },

  { id: "cerave-moisturizing-cream", category: "Moisturizer", name: "Moisturizing Cream", brand: "CeraVe", price: "~$19", skinTypes: ["Dry", "Normal"], concerns: ["Dryness"], period: "both", fragranceFree: true, gentle: true, blurb: "Rich cream with ceramides for long-lasting comfort." },
  { id: "neutrogena-hydro-boost", category: "Moisturizer", name: "Hydro Boost Water Gel", brand: "Neutrogena", price: "~$25", skinTypes: ["Oily", "Combination", "Normal"], concerns: ["Dryness", "Dullness"], period: "both", fragranceFree: false, gentle: false, blurb: "Bouncy gel that hydrates without feeling heavy." },
  { id: "lrp-double-repair", category: "Moisturizer", name: "Toleriane Double Repair Moisturizer", brand: "La Roche-Posay", price: "~$23", skinTypes: [], concerns: ["Redness", "Dryness"], period: "both", fragranceFree: true, gentle: true, blurb: "Barrier-loving lotion that plays nice with actives." },
  { id: "vanicream-moisturizer", category: "Moisturizer", name: "Daily Facial Moisturizer", brand: "Vanicream", price: "~$15", skinTypes: [], concerns: ["Redness"], period: "both", fragranceFree: true, gentle: true, blurb: "Light and simple, great for sensitive skin." },

  { id: "lrp-anthelios-60", category: "SPF", name: "Anthelios Melt-in Milk SPF 60", brand: "La Roche-Posay", price: "~$38", skinTypes: ["Dry", "Normal"], concerns: ["Sun protection", "Dark spots"], period: "morning", fragranceFree: true, gentle: true, blurb: "High protection with a soft, lotion feel." },
  { id: "eltamd-uv-clear", category: "SPF", name: "UV Clear Broad-Spectrum SPF 46", brand: "EltaMD", price: "~$43", skinTypes: ["Oily", "Combination", "Normal"], concerns: ["Breakouts", "Redness", "Sun protection"], period: "morning", fragranceFree: true, gentle: true, blurb: "Lightweight and loved by breakout-prone skin." },
  { id: "supergoop-unseen", category: "SPF", name: "Unseen Sunscreen SPF 40", brand: "Supergoop!", price: "~$38", skinTypes: ["Oily", "Combination", "Normal"], concerns: ["Sun protection"], period: "morning", fragranceFree: false, gentle: false, blurb: "Invisible gel that doubles as a makeup primer." },
  { id: "neutrogena-ultra-sheer", category: "SPF", name: "Ultra Sheer Dry-Touch SPF 55", brand: "Neutrogena", price: "~$12", skinTypes: [], concerns: ["Sun protection"], period: "morning", fragranceFree: false, gentle: false, blurb: "Budget-friendly daily sunscreen." },
];

export type SkinProfileLite = {
  skin_type: string | null;
  concerns: string[];
  sensitivity: string | null;
  avoid_ingredients: string[];
};

export type RankedProduct = Product & { score: number; reason: string };

/** Score a product for this person. Higher = better fit. */
export function rankProducts(
  profile: SkinProfileLite,
  routineProducts: string[],
  category?: ProductCategory,
): RankedProduct[] {
  const avoidsFragrance = profile.avoid_ingredients.includes("Fragrance");
  const sensitive = profile.sensitivity === "Very sensitive";
  const routineText = routineProducts.join(" ").toLowerCase();

  return PRODUCTS.filter((p) => !category || p.category === category)
    .filter((p) => !(avoidsFragrance && !p.fragranceFree))
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];
      const typeMatch = p.skinTypes.length === 0 || (profile.skin_type ? p.skinTypes.includes(profile.skin_type) : false);
      if (typeMatch) {
        score += 3;
        reasons.push(
          profile.skin_type && profile.skin_type !== "Not sure"
            ? `Suits ${profile.skin_type.toLowerCase()} skin.`
            : "Works for most skin types.",
        );
      }
      const matched = p.concerns.filter((c) => profile.concerns.includes(c));
      if (matched.length) {
        score += matched.length * 2;
        reasons.push(`Targets ${matched.map((m) => m.toLowerCase()).join(" and ")}.`);
      }
      if (sensitive) {
        if (p.gentle) {
          score += 2;
          reasons.push("Gentle pick for sensitive skin.");
        } else score -= 2;
      }
      const keyword = p.category === "SPF" ? "spf" : p.category.toLowerCase();
      if (!routineText.includes(keyword)) {
        score += 1;
        reasons.push(`Fills the ${p.category === "SPF" ? "sunscreen" : p.category.toLowerCase()} step in your routine.`);
      } else {
        reasons.push(`Fits your ${CATEGORY_QUEST_TITLE[p.category]} quest.`);
      }
      if (p.period === "morning") reasons.push("Best used in the morning.");
      if (p.period === "evening") reasons.push("Best used at night.");
      return { ...p, score, reason: reasons.slice(0, 3).join(" ") };
    })
    .sort((a, b) => b.score - a.score);
}
