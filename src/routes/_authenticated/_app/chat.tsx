import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUp, Check, ChevronLeft, Plus, ShoppingBag, Stethoscope } from "lucide-react";
import { Chick, type ChickMood } from "@/components/chick";
import { Button } from "@/components/ui/button";
import { chatWithBuddy, type ChatAction } from "@/lib/ai.functions";
import { profileQuery, useAddQuest } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/chat")({
  head: () => ({
    meta: [
      { title: "Chat with your buddy — DermaLens" },
      { name: "description", content: "Ask your skincare buddy anything about your skin, products or routine." },
      { property: "og:title", content: "Chat with your buddy — DermaLens" },
      { property: "og:description", content: "Friendly skincare answers, any time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: number; role: "user" | "assistant"; content: string; actions?: ChatAction[]; mood?: ChickMood };

const SUGGESTIONS = ["Why is my skin dry?", "Build a night routine", "Is this product safe?", "Find a dermatologist near me"];

function ChatPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const pet = profile.pet_name;
  const name = profile.display_name?.split(" ")[0] || "friend";
  const send = useServerFn(chatWithBuddy);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", content: `Hi ${name}! Ask me anything about your skin, your products or your routine.` },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(content: string) {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    const next: Msg[] = [...messages, { id: Date.now(), role: "user", content: trimmed }];
    setMessages(next);
    setText("");
    setBusy(true);
    try {
      const history = next.slice(1).slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const res = await send({ data: { messages: history } });
      if (!res.ok) {
        setMessages((m) => [...m, { id: Date.now(), role: "assistant", content: res.error, mood: "concerned" }]);
      } else {
        setMessages((m) => [
          ...m,
          { id: Date.now(), role: "assistant", content: res.reply, actions: res.actions, mood: res.mood },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: Date.now(), role: "assistant", content: "I lost my connection for a sec. Try again?", mood: "concerned" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(text);
  }

  const lastMood = [...messages].reverse().find((m) => m.role === "assistant")?.mood ?? "happy";

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 px-5 pb-3 pt-6 backdrop-blur">
        <Link to="/home" aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
          <ChevronLeft className="h-7 w-7" strokeWidth={2.6} />
        </Link>
        <Chick className="w-14" mood={busy ? "thinking" : lastMood} />
        <div>
          <h1 className="text-2xl font-black leading-tight">{pet}</h1>
          <p className="font-bold text-muted-foreground">Your skincare buddy</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-40 pt-2" aria-live="polite">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-10 self-end rounded-[1.6rem] rounded-br-lg border-2 border-primary-deep/50 bg-primary px-5 py-3 text-lg font-bold">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <Chick className="w-10 shrink-0" mood={m.mood ?? "happy"} shadow={false} />
              <div className="flex max-w-[85%] flex-col gap-2">
                <div className="bubble whitespace-pre-line rounded-bl-lg text-lg font-semibold">{m.content}</div>
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {m.actions.map((a, i) => (
                      <ActionButton key={i} action={a} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex items-end gap-2">
            <Chick className="w-10 shrink-0" mood="thinking" shadow={false} />
            <div className="bubble flex gap-1.5 rounded-bl-lg" aria-label={`${pet} is typing`}>
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
            </div>
          </div>
        )}
        {messages.length === 1 && !busy && (
          <div className="flex flex-col items-start gap-3 pt-2">
            {SUGGESTIONS.map((s) => (
              <Button key={s} variant="chip" onClick={() => ask(s)}>
                {s}
              </Button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md rounded-t-[2rem] border-2 border-b-0 border-border bg-card px-4 pt-4 shadow-pop"
      >
        <div className="flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={`Ask ${pet} anything`}
            aria-label={`Message ${pet}`}
            className="h-14 min-w-0 flex-1 rounded-full border-2 border-border bg-background px-5 text-lg font-semibold outline-none placeholder:text-muted-foreground/70 focus:border-primary-deep"
          />
          <Button type="submit" size="icon" className="h-14 w-14 shrink-0" disabled={busy || !text.trim()} aria-label="Send">
            <ArrowUp className="!size-6" strokeWidth={3} />
          </Button>
        </div>
        <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
          {pet} shares skincare tips, not medical advice.
        </p>
      </form>
    </main>
  );
}

function ActionButton({ action }: { action: ChatAction }) {
  const addQuest = useAddQuest();
  const [added, setAdded] = useState(false);
  if (action.type === "open_products") {
    return (
      <Button asChild variant="chip" size="sm" className="self-start">
        <Link to="/products"><ShoppingBag /> See recommended products</Link>
      </Button>
    );
  }
  if (action.type === "open_dermatologists") {
    return (
      <Button asChild variant="chip" size="sm" className="self-start">
        <Link to="/dermatologists"><Stethoscope /> Find a dermatologist</Link>
      </Button>
    );
  }
  const period = action.period === "evening" ? "evening" : "morning";
  return (
    <Button
      variant="chip"
      size="sm"
      className={cn("h-auto min-h-10 self-start whitespace-normal py-2 text-left", added && "border-success text-success")}
      disabled={added || addQuest.isPending}
      onClick={() =>
        addQuest.mutate(
          { period, title: action.title || "New step", product: action.product, icon: action.icon },
          {
            onSuccess: () => {
              setAdded(true);
              toast.success(`Added to your ${period} quests!`);
            },
            onError: (e) => toast.error(e.message),
          },
        )
      }
    >
      {added ? <Check /> : <Plus />}
      {added ? "Added" : `Add “${action.title}” to ${period} quests`}
    </Button>
  );
}
