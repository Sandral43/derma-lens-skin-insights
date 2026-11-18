import { useEffect } from "react";
import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { coinsQuery, profileQuery, questsQuery, recentCompletionsQuery } from "@/lib/data";
import { useProgress } from "@/hooks/use-progress";
import { toDateKey } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient.ensureQueryData(profileQuery);
    if (!profile.onboarded) throw redirect({ to: "/onboarding" });
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(questsQuery),
      context.queryClient.ensureQueryData(recentCompletionsQuery()),
      context.queryClient.ensureQueryData(coinsQuery),
    ]),
  component: AppLayout,
});

const NAV_PAGES = ["/home", "/quests", "/scan", "/calendar", "/products"];

function AppLayout() {
  const { pathname } = useLocation();
  const showNav = NAV_PAGES.includes(pathname);
  useReminders();
  return (
    <>
      <Outlet />
      {showNav && <BottomNav activeOverride={pathname === "/products" ? "/quests" : undefined} />}
    </>
  );
}

/** Gentle in-app nudges at the person's reminder times while DermaLens is open. */
function useReminders() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { counts, doneMorning, doneEvening } = useProgress();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile.daily_reminders) return;
    function check() {
      const now = new Date();
      const today = toDateKey(now);
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const slots = [
        { period: "morning" as const, at: profile.morning_reminder.slice(0, 5), done: doneMorning >= counts.morning, until: "15:00" },
        { period: "evening" as const, at: profile.evening_reminder.slice(0, 5), done: doneEvening >= counts.evening, until: "23:59" },
      ];
      for (const s of slots) {
        const key = `dl-reminder-${s.period}-${today}`;
        if (s.done || hhmm < s.at || hhmm > s.until || localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        toast(`${profile.pet_name}: time for your ${s.period} quests!`, {
          description: "A few minutes of care, lots of glow.",
          action: { label: "Let's go", onClick: () => navigate({ to: "/quests", search: { period: s.period } }) },
        });
      }
    }
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [profile, counts, doneMorning, doneEvening, navigate]);
}
