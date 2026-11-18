import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, LocateFixed, MapPin, Navigation, Phone } from "lucide-react";
import { BuddySays } from "@/components/buddy-scene";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { findDermatologists, type Dermatologist, type DermSearchResult } from "@/lib/derm.functions";
import { SUPPORT_EMAIL } from "@/lib/policies";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/dermatologists")({
  head: () => ({
    meta: [
      { title: "Dermatologists near you — DermaLens" },
      { name: "description", content: "Find dermatology clinics near you and call, get directions or book." },
      { property: "og:title", content: "Dermatologists near you — DermaLens" },
      { property: "og:description", content: "Find a skin professional nearby." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DermPage,
});

const RADII = [5, 10, 25] as const;
const TINTS = ["bg-blush", "bg-sky", "bg-mint", "bg-butter"];

function DermPage() {
  const find = useServerFn(findDermatologists);
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState<(typeof RADII)[number]>(10);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const search = useMutation({
    mutationFn: async (args: { city?: string; lat?: number; lon?: number; radiusMiles: 5 | 10 | 25 }) =>
      find({ data: args }) as Promise<DermSearchResult>,
    onSuccess: (r) => {
      if (!r.ok) toast(r.error);
    },
    onError: () => toast.error("Search didn't work. Please try again."),
  });

  function runSearch(r = radius, c = coords) {
    if (c) search.mutate({ lat: c.lat, lon: c.lon, radiusMiles: r });
    else if (city.trim().length > 1) search.mutate({ city: city.trim(), radiusMiles: r });
    else toast("Type a city or use your location first.");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCoords(null);
    if (city.trim().length > 1) search.mutate({ city: city.trim(), radiusMiles: radius });
  }

  function useLocation() {
    if (!navigator.geolocation) {
      toast("Location isn't available on this device. Type a city instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(c);
        setCity("");
        runSearch(radius, c);
      },
      () => {
        setLocating(false);
        toast("I couldn't get your location. You can type a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const data = search.data?.ok ? search.data : null;

  return (
    <main className="px-5 pb-16">
      <PageHeader title="Dermatologists near you" />
      <BuddySays mood="concerned">
        I can help you find a professional. I'm not a doctor, so see one for anything that worries you.
      </BuddySays>

      <form onSubmit={onSubmit} className="mt-5 flex gap-3">
        <label className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-border bg-card px-4">
          <MapPin className="h-5 w-5 shrink-0" />
          <input
            value={coords ? "Your location" : city}
            onChange={(e) => {
              setCoords(null);
              setCity(e.target.value);
            }}
            placeholder="City, State"
            aria-label="City"
            className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-muted-foreground/70"
          />
        </label>
        <Button type="button" className="h-14 shrink-0 px-4" onClick={useLocation} disabled={locating}>
          <LocateFixed /> {locating ? "…" : "Near me"}
        </Button>
      </form>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">Your location is used only for this search.</p>

      <div className="mt-4 flex items-center gap-2">
        {RADII.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={radius === r}
            onClick={() => {
              setRadius(r);
              if (data) runSearch(r);
            }}
            className={cn(
              "h-12 whitespace-nowrap rounded-full border-2 px-4 text-base font-extrabold",
              radius === r ? "border-primary-deep/50 bg-primary" : "border-border bg-card",
            )}
          >
            {r} mi
          </button>
        ))}
        <Button variant="outline" className="ml-auto" onClick={() => runSearch()} disabled={search.isPending}>
          {search.isPending ? "Searching…" : "Search"}
        </Button>
      </div>

      <MiniMap results={data?.results ?? []} center={data?.center} radius={radius} loading={search.isPending} />

      <div className="mt-5 flex flex-col gap-4">
        {data?.results.map((d, i) => <DermCard key={d.id} d={d} index={i} />)}
        {data && data.results.length === 0 && (
          <div className="card-cozy p-5 text-center">
            <p className="font-bold">No dermatology listings found within {radius} miles.</p>
            <Button asChild variant="outline" className="mt-4">
              <a
                href={`https://www.google.com/maps/search/dermatologist/@${data.center.lat},${data.center.lon},12z`}
                target="_blank"
                rel="noreferrer"
              >
                Search on Google Maps
              </a>
            </Button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
        Listings come from OpenStreetMap and are suggestions, not endorsements.{" "}
        <a className="underline" href={`mailto:${SUPPORT_EMAIL}?subject=Dermatologist%20listing%20problem`}>
          Report a problem
        </a>
      </p>
    </main>
  );
}

function MiniMap({
  results,
  center,
  radius,
  loading,
}: {
  results: Dermatologist[];
  center?: { lat: number; lon: number; label: string } | undefined;
  radius: number;
  loading: boolean;
}) {
  // Simple projection: miles offset from the center, scaled to the radius.
  const pins = center
    ? results.slice(0, 9).map((r) => {
        const dy = (r.lat - center.lat) * 69;
        const dx = (r.lon - center.lon) * 69 * Math.cos((center.lat * Math.PI) / 180);
        const clamp = (v: number) => Math.max(8, Math.min(92, v));
        return { id: r.id, x: clamp(50 + (dx / radius) * 45), y: clamp(50 - (dy / radius) * 45) };
      })
    : [];
  return (
    <div
      className={cn("relative mt-5 h-56 overflow-hidden rounded-[2rem] border-[3px] border-border bg-mint/50", loading && "animate-pulse")}
      aria-label={center ? `Map around ${center.label}` : "Map"}
      role="img"
    >
      <div aria-hidden className="absolute inset-y-0 left-[44%] w-5 bg-card" />
      <div aria-hidden className="absolute inset-x-0 top-[48%] h-5 bg-card" />
      <div aria-hidden className="absolute right-[10%] top-[8%] h-16 w-28 rounded-3xl bg-grass" />
      <div aria-hidden className="absolute bottom-[10%] left-[6%] h-14 w-32 rounded-3xl bg-sky" />
      {center && (
        <span aria-hidden className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-accent" style={{ left: "50%", top: "50%" }} />
      )}
      {pins.map((p, i) => (
        <span
          key={p.id}
          aria-hidden
          className="absolute flex h-9 w-9 items-center justify-center rounded-full rounded-bl-none border-[3px] border-foreground bg-primary text-sm font-black [transform:translate(-50%,-100%)_rotate(-45deg)]"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span className="rotate-45">{i + 1}</span>
        </span>
      ))}
      {!center && !loading && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center font-extrabold text-muted-foreground">
          Search a city or use your location to see clinics nearby.
        </p>
      )}
    </div>
  );
}

function DermCard({ d, index }: { d: Dermatologist; index: number }) {
  const initials = d.name
    .replace(/^(dr\.?|doctor)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const bookHref = d.website ?? `https://www.google.com/search?q=${encodeURIComponent(`${d.name} ${d.address ?? ""} book appointment`)}`;
  return (
    <article className="card-cozy p-5">
      <div className="flex gap-4">
        <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-black", TINTS[index % TINTS.length])}>
          {initials || "Dr"}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black leading-tight">{d.name}</h2>
          {d.clinic && <p className="truncate font-semibold capitalize text-muted-foreground">{d.clinic}</p>}
          <p className="font-semibold text-muted-foreground">
            {d.distanceMiles} mi{d.address ? ` · ${d.address}` : ""}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-black">{index + 1}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold">
        <span className="rounded-full bg-mint px-3 py-1.5">Dermatology</span>
        <span className="rounded-full bg-sky px-3 py-1.5">Call to check new patients</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {d.phone ? (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`}><Phone /> Call</a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <Phone /> Call
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lon}`} target="_blank" rel="noreferrer">
            <Navigation /> Directions
          </a>
        </Button>
        <Button asChild size="sm">
          <a href={bookHref} target="_blank" rel="noreferrer">
            {d.website ? <Globe /> : null} Book
          </a>
        </Button>
      </div>
    </article>
  );
}
