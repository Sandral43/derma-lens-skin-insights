import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z
  .object({
    city: z.string().trim().max(120).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    radiusMiles: z.union([z.literal(5), z.literal(10), z.literal(25)]),
  })
  .refine((v) => (v.lat !== undefined && v.lon !== undefined) || (v.city && v.city.length > 1), {
    message: "Enter a city or use your location",
  });

export type Dermatologist = {
  id: string;
  name: string;
  clinic: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number;
  lon: number;
  distanceMiles: number;
};

export type DermSearchResult =
  | { ok: true; center: { lat: number; lon: number; label: string }; results: Dermatologist[] }
  | { ok: false; error: string };

const UA = "DermaLens/1.0 (skincare companion app)";

function haversineMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const findDermatologists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => input.parse(v))
  .handler(async ({ data }): Promise<DermSearchResult> => {
    try {
      let center: { lat: number; lon: number; label: string };
      if (data.lat !== undefined && data.lon !== undefined) {
        center = { lat: data.lat, lon: data.lon, label: "Your location" };
      } else {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(data.city ?? "")}`,
          { headers: { "User-Agent": UA, Accept: "application/json" } },
        );
        if (!geo.ok) return { ok: false, error: "Couldn't look up that place right now. Try again soon." };
        const places = (await geo.json()) as Array<{ lat: string; lon: string; display_name: string }>;
        const place = places[0];
        if (!place) return { ok: false, error: "I couldn't find that place. Try “City, State”." };
        center = {
          lat: Number(place.lat),
          lon: Number(place.lon),
          label: place.display_name.split(",").slice(0, 2).join(","),
        };
      }

      const meters = Math.round(data.radiusMiles * 1609.34);
      const around = `(around:${meters},${center.lat},${center.lon})`;
      const query = `[out:json][timeout:20];
(
  nwr["healthcare:speciality"~"dermatology",i]${around};
  nwr["amenity"~"doctors|clinic"]["name"~"derm|skin",i]${around};
  nwr["healthcare"~"doctor|clinic"]["name"~"derm|skin",i]${around};
);
out center 60;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) return { ok: false, error: "The map directory is busy. Please try again in a moment." };
      const json = (await res.json()) as {
        elements: Array<{
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };

      const seen = new Set<string>();
      const results: Dermatologist[] = [];
      for (const el of json.elements ?? []) {
        const tags = el.tags ?? {};
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const name = tags["name"];
        if (!name || lat === undefined || lon === undefined) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
        const address = [street, tags["addr:city"]].filter(Boolean).join(", ") || null;
        results.push({
          id: `${el.type}-${el.id}`,
          name,
          clinic: tags["operator"] ?? tags["healthcare:speciality"]?.replace(/;/g, ", ") ?? null,
          address,
          phone: tags["phone"] ?? tags["contact:phone"] ?? null,
          website: tags["website"] ?? tags["contact:website"] ?? null,
          lat,
          lon,
          distanceMiles: Math.round(haversineMiles(center, { lat, lon }) * 10) / 10,
        });
      }
      results.sort((a, b) => a.distanceMiles - b.distanceMiles);
      return { ok: true, center, results: results.slice(0, 12) };
    } catch (error) {
      console.error("findDermatologists failed", error);
      return { ok: false, error: "Something went wrong while searching. Please try again." };
    }
  });
