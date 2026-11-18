import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, back = true, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-2 pb-4 pt-6">
      {back && (
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Go back"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.6} />
        </button>
      )}
      <h1 className="flex-1 text-[1.75rem] font-black leading-tight">{title}</h1>
      {right}
    </header>
  );
}
