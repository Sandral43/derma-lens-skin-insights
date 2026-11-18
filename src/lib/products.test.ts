import { describe, expect, it } from "vitest";
import { rankProducts } from "./products";

describe("product recommendations", () => {
  it("never recommends fragranced products to someone avoiding fragrance", () => {
    const ranked = rankProducts(
      { skin_type: "Oily", concerns: [], sensitivity: null, avoid_ingredients: ["Fragrance"] },
      [],
    );
    expect(ranked.every((p) => p.fragranceFree)).toBe(true);
  });

  it("filters to the chosen category", () => {
    const ranked = rankProducts({ skin_type: null, concerns: [], sensitivity: null, avoid_ingredients: [] }, [], "SPF");
    expect(new Set(ranked.map((p) => p.category))).toEqual(new Set(["SPF"]));
  });
});
