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

      // Query both public sources at once; either may be slow or busy.
      const [fromOverpass, fromNominatim] = await Promise.all([
        searchOverpass(center, data.radiusMiles).catch((e) => {
          console.warn("overpass unavailable", e);
          return [] as Dermatologist[];
        }),
        searchNominatim(center, data.radiusMiles).catch(() => [] as Dermatologist[]),
      ]);
      const results = [...fromOverpass];
      const names = new Set(results.map((r) => r.name.toLowerCase()));
      for (const r of fromNominatim) if (!names.has(r.name.toLowerCase())) results.push(r);
      const within = results.filter((r) => r.distanceMiles <= data.radiusMiles + 0.5);
      within.sort((a, b) => a.distanceMiles - b.distanceMiles);
      return { ok: true, center, results: within.slice(0, 12) };
    } catch (error) {
      console.error("findDermatologists failed", error);
      return { ok: false, error: "Something went wrong while searching. Please try again." };
    }
  });

type Center = { lat: number; lon: number };

async function searchOverpass(center: Center, radiusMiles: number): Promise<Dermatologist[]> {
  const meters = Math.round(radiusMiles * 1609.34);
  const around = `(around:${meters},${center.lat},${center.lon})`;
  const query = `[out:json][timeout:8];
(
  nwr["healthcare:speciality"~"dermatology"]${around};
  nwr["amenity"~"^(doctors|clinic)$"]["name"~"[Dd]erm"]${around};
);
out center 60;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  const json = (await res.json()) as {
    elements?: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
  const seen = new Set<string>();
  const out: Dermatologist[] = [];
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
    out.push({
      id: `${el.type}-${el.id}`,
      name,
      clinic: tags["operator"] ?? null,
      address: [street, tags["addr:city"]].filter(Boolean).join(", ") || null,
      phone: tags["phone"] ?? tags["contact:phone"] ?? null,
      website: tags["website"] ?? tags["contact:website"] ?? null,
      lat,
      lon,
      distanceMiles: Math.round(haversineMiles(center, { lat, lon }) * 10) / 10,
    });
  }
  return out;
}

async function searchNominatim(center: Center, radiusMiles: number): Promise<Dermatologist[]> {
  const dLat = radiusMiles / 69;
  const dLon = radiusMiles / (69 * Math.cos((center.lat * Math.PI) / 180));
  const viewbox = [center.lon - dLon, center.lat + dLat, center.lon + dLon, center.lat - dLat].join(",");
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&extratags=1&addressdetails=1&bounded=1&viewbox=${viewbox}&q=dermatology`,
    { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(9000) },
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    name: string;
    category: string;
    extratags?: Record<string, string> | null;
    address?: Record<string, string>;
  }>;
  return rows
    .filter((r) => r.name && ["amenity", "healthcare", "building", "office"].includes(r.category))
    .map((r) => {
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      const a = r.address ?? {};
      const street = [a["house_number"], a["road"]].filter(Boolean).join(" ");
      const city = a["city"] ?? a["town"] ?? a["village"] ?? a["suburb"];
      return {
        id: `${r.osm_type}-${r.osm_id}`,
        name: r.name,
        clinic: null,
        address: [street, city].filter(Boolean).join(", ") || null,
        phone: r.extratags?.["phone"] ?? r.extratags?.["contact:phone"] ?? null,
        website: r.extratags?.["website"] ?? r.extratags?.["contact:website"] ?? null,
        lat,
        lon,
        distanceMiles: Math.round(haversineMiles(center, { lat, lon }) * 10) / 10,
      };
    });
}
