import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Chick } from "@/components/chick";
import { useProgress } from "@/hooks/use-progress";
import { completionsQuery, profileQuery, scansQuery, signedPhotoUrl, type Scan } from "@/lib/data";
import { currentPeriod, formatTime, fromDateKey, toDateKey } from "@/lib/dates";
import { doneCount, isDayDone, type CompletionLite } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/calendar")({
  loader: ({ context }) => context.queryClient.ensureQueryData(scansQuery),
  head: () => ({
    meta: [
      { title: "Calendar — DermaLens" },
      { name: "description", content: "See the days you completed your routine and your skin check history." },
      { property: "og:title", content: "Calendar — DermaLens" },
      { property: "og:description", content: "Your routine days and skin checks at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarPage() {
  const { counts, todayKey } = useProgress();
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: scans } = useSuspenseQuery(scansQuery);
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const from = toDateKey(first);
  const to = toDateKey(new Date(view.y, view.m, daysInMonth));
  const { data: monthCompletions = [] } = useQuery(completionsQuery(from, to));
  const { data: selCompletions = [] } = useQuery(completionsQuery(selected, selected));
  const lite = monthCompletions as CompletionLite[];

  const scansByDay = useMemo(() => {
    const m = new Map<string, Scan>();
    for (const s of scans) if (!m.has(s.scanned_on)) m.set(s.scanned_on, s);
    return m;
  }, [scans]);

  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(view.y, view.m, i + 1))),
  ];

  function shift(delta: number) {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  const selDate = fromDateKey(selected);
  const selLite = selCompletions as CompletionLite[];
  const mDone = doneCount(selected, "morning", selLite);
  const eDone = doneCount(selected, "evening", selLite);
  const isToday = selected === todayKey;
  const isFuture = selected > todayKey;
  const scan = scansByDay.get(selected);

  return (
    <main className="px-5 pb-36">
      <header className="flex items-center justify-between pb-4 pt-6">
        <h1 className="text-[2.1rem] font-black">
          {first.toLocaleDateString([], { month: "long", year: "numeric" })}
        </h1>
        <div className="flex">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <ChevronLeft className="h-7 w-7" strokeWidth={2.6} />
          </button>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <ChevronRight className="h-7 w-7" strokeWidth={2.6} />
          </button>
        </div>
      </header>

      <section className="card-cozy p-4">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK.map((d, i) => (
            <span key={i} className="pb-2 text-sm font-black text-muted-foreground">{d}</span>
          ))}
          {cells.map((key, i) => {
            if (!key) return <span key={`b${i}`} />;
            const done = isDayDone(key, lite, counts);
            const today = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={selected === key}
                aria-label={`${fromDateKey(key).toLocaleDateString([], { month: "long", day: "numeric" })}${done ? ", routine done" : ""}`}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-2xl text-lg font-black",
                  done && "bg-mint",
                  today && "border-2 border-primary-deep/60 bg-primary",
                  selected === key && "ring-[3px] ring-foreground/70",
                )}
              >
                {Number(key.slice(8))}
                {scansByDay.has(key) && (
                  <span aria-hidden className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-bold text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-mint" /> Routine done</span>
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-primary" /> Today</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /> Skin check</span>
      </div>

      <section className="card-cozy mt-5 px-5">
        <div className="flex items-center justify-between border-b-2 border-border py-4">
          <h2 className="text-xl font-black">
            {selDate.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </h2>
          <Chick className="w-14" mood={isDayDone(selected, selLite, counts) ? "joy" : "happy"} />
        </div>
        <DetailRow
          title="Morning quests"
          sub={`${mDone} of ${counts.morning} done`}
          pill={statusPill(mDone, counts.morning, isToday, isFuture, isToday && currentPeriod() === "evening")}
        />
        <DetailRow
          title="Evening quests"
          sub={eDone > 0 ? `${eDone} of ${counts.evening} done` : `Reminder at ${formatTime(profile.evening_reminder)}`}
          pill={statusPill(eDone, counts.evening, isToday, isFuture, false, isToday && currentPeriod() === "morning")}
        />
        <div className="flex items-center gap-4 border-t-2 border-border py-4">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black">Skin photo</p>
            {scan ? (
              <p className="font-semibold text-muted-foreground">
                Hydration {scan.hydration} · Texture {scan.texture} · Clarity {scan.clarity}
              </p>
            ) : (
              <p className="font-semibold text-muted-foreground">Log your daily check</p>
            )}
          </div>
          {scan?.photo_path ? (
            <ScanThumb path={scan.photo_path} />
          ) : scan ? (
            <Pill tone="mint">Done</Pill>
          ) : isToday ? (
            <Link to="/scan"><Pill tone="blush">To do</Pill></Link>
          ) : (
            <Pill tone="muted">{isFuture ? "Later" : "Skipped"}</Pill>
          )}
        </div>
      </section>
    </main>
  );
}

function statusPill(done: number, total: number, isToday: boolean, isFuture: boolean, overdue = false, later = false) {
  if (total > 0 && done >= total) return <Pill tone="mint">Done</Pill>;
  if (isFuture || later) return <Pill tone="sky">Later</Pill>;
  if (done > 0) return <Pill tone="butter">Keep going</Pill>;
  if (isToday && !overdue) return <Pill tone="butter">Let's go</Pill>;
  return <Pill tone="muted">Rest day</Pill>;
}

function DetailRow({ title, sub, pill }: { title: string; sub: string; pill: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b-2 border-border py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-black">{title}</p>
        <p className="font-semibold text-muted-foreground">{sub}</p>
      </div>
      {pill}
    </div>
  );
}

function Pill({ tone, children }: { tone: "mint" | "butter" | "sky" | "blush" | "muted"; children: React.ReactNode }) {
  const bg = { mint: "bg-mint", butter: "bg-butter", sky: "bg-sky", blush: "bg-blush", muted: "bg-muted" }[tone];
  return <span className={cn("rounded-full px-4 py-2 font-black", bg)}>{children}</span>;
}

function ScanThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signedPhotoUrl(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  return url ? (
    <img src={url} alt="Your skin photo for this day" className="h-16 w-16 rounded-2xl border-2 border-border object-cover" />
  ) : (
    <span className="h-16 w-16 animate-pulse rounded-2xl bg-muted" />
  );
}
