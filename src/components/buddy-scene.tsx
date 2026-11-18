import type { ReactNode } from "react";
import { Chick, type ChickMood } from "@/components/chick";
import { cn } from "@/lib/utils";

/** Sky + hill scene with the buddy and a speech bubble on top. */
export function BuddyScene({
  message,
  mood = "happy",
  className,
  chickClassName,
  children,
}: {
  message?: ReactNode;
  mood?: ChickMood;
  className?: string;
  chickClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("scene-sky px-5 pt-5", className)}>
      {message && (
        <div className="relative z-10 rounded-[1.6rem] bg-card px-5 py-4 text-center text-lg font-extrabold leading-snug">
          {message}
        </div>
      )}
      <div aria-hidden className="absolute left-6 top-[38%] h-7 w-24 rounded-full bg-cloud" />
      <div aria-hidden className="absolute right-8 top-[48%] h-6 w-16 rounded-full bg-cloud" />
      <div
        aria-hidden
        className="absolute -left-[10%] bottom-0 h-[40%] w-[120%] rounded-t-[100%] bg-grass"
      />
      <div className="relative z-10 flex justify-center">
        <Chick mood={mood} className={cn("w-40 animate-bob", chickClassName)} />
      </div>
      {children}
    </div>
  );
}

/** Small buddy with a side speech bubble. */
export function BuddySays({
  children,
  mood = "happy",
  className,
}: {
  children: ReactNode;
  mood?: ChickMood;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Chick mood={mood} className="w-16 shrink-0" />
      <div className="bubble flex-1 text-[0.95rem]">{children}</div>
    </div>
  );
}
