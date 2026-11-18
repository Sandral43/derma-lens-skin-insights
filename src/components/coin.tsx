import { cn } from "@/lib/utils";

export function Coin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-5 w-5 rounded-full border-[3px] border-coin-edge bg-coin", className)}
    />
  );
}
