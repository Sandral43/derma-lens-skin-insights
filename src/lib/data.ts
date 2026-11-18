import { queryOptions, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { addDays, toDateKey, type Period } from "./dates";

export type Profile = Tables<"profiles">;
export type Quest = Tables<"quests">;
export type Completion = Tables<"quest_completions">;
export type Scan = Tables<"scans">;

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Please sign in again.");
  return id;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async (): Promise<Profile> => {
    const id = await requireUserId();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return data;
    // Safety net if the signup trigger hasn't created the row yet.
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ id })
      .select("*")
      .single();
    if (insertError) throw insertError;
    return created;
  },
});

export const questsQuery = queryOptions({
  queryKey: ["quests"],
  queryFn: async (): Promise<Quest[]> => {
    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export function completionsQuery(from: string, to: string) {
  return queryOptions({
    queryKey: ["completions", from, to],
    queryFn: async (): Promise<Completion[]> => {
      const { data, error } = await supabase
        .from("quest_completions")
        .select("*")
        .gte("completed_on", from)
        .lte("completed_on", to)
        .order("completed_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Last 90 days: enough for the streak and today's checks. */
export function recentCompletionsQuery() {
  const today = toDateKey(new Date());
  return completionsQuery(addDays(today, -90), addDays(today, 1));
}

export const coinsQuery = queryOptions({
  queryKey: ["coins"],
  queryFn: async (): Promise<number> => {
    const { data, error } = await supabase.rpc("coin_total");
    if (error) throw error;
    return data ?? 0;
  },
});

export const scansQuery = queryOptions({
  queryKey: ["scans"],
  queryFn: async (): Promise<Scan[]> => {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },
});

export const savedProductsQuery = queryOptions({
  queryKey: ["saved-products"],
  queryFn: async (): Promise<string[]> => {
    const { data, error } = await supabase.from("saved_products").select("product_id");
    if (error) throw error;
    return data.map((r) => r.product_id);
  },
});

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"profiles">) => {
      const id = await requireUserId();
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.setQueryData(profileQuery.queryKey, data),
  });
}

export function useToggleQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quest, dateKey, done }: { quest: Quest; dateKey: string; done: boolean }) => {
      if (done) {
        const { error } = await supabase
          .from("quest_completions")
          .insert({ quest_id: quest.id, completed_on: dateKey, period: quest.period, reward: quest.reward });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("quest_completions")
          .delete()
          .eq("quest_id", quest.id)
          .eq("completed_on", dateKey);
        if (error) throw error;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      qc.invalidateQueries({ queryKey: ["coins"] });
    },
  });
}

export function useAddQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: { period: Period; title: string; product: string; icon: string }) => {
      const current = (qc.getQueryData(questsQuery.queryKey) ?? []).filter((x) => x.period === q.period);
      const position = current.length ? Math.max(...current.map((x) => x.position)) + 1 : 0;
      const row: TablesInsert<"quests"> = { ...q, position };
      const { data, error } = await supabase.from("quests").insert(row).select("*").single();
      if (error) throw error;
      return data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: questsQuery.queryKey }),
  });
}

export function useUpdateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"quests"> }) => {
      const { error } = await supabase.from("quests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: questsQuery.queryKey }),
  });
}

export function useDeleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quests").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: questsQuery.queryKey });
      qc.invalidateQueries({ queryKey: ["completions"] });
    },
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, saved }: { productId: string; saved: boolean }) => {
      if (saved) {
        const { error } = await supabase.from("saved_products").insert({ product_id: productId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("saved_products").delete().eq("product_id", productId);
        if (error) throw error;
      }
    },
    onMutate: ({ productId, saved }) => {
      const prev = qc.getQueryData(savedProductsQuery.queryKey) ?? [];
      qc.setQueryData(
        savedProductsQuery.queryKey,
        saved ? [...prev, productId] : prev.filter((p) => p !== productId),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: savedProductsQuery.queryKey }),
  });
}

export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("skin-photos").createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

/** Everything we store about the signed-in person, as plain JSON. */
export async function exportMyData() {
  const id = await requireUserId();
  const [profile, quests, completions, scans, saved] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("quests").select("*"),
    supabase.from("quest_completions").select("*").limit(10000),
    supabase.from("scans").select("*").limit(10000),
    supabase.from("saved_products").select("*"),
  ]);
  const { data: session } = await supabase.auth.getSession();
  return {
    exported_at: new Date().toISOString(),
    account: { id, email: session.session?.user.email ?? null },
    profile: profile.data,
    quests: quests.data ?? [],
    quest_completions: completions.data ?? [],
    skin_scans: (scans.data ?? []).map((s) => ({ ...s, photo_note: s.photo_path ? "Photo stored privately in your account" : null })),
    saved_products: saved.data ?? [],
    chats: "Chats with your buddy are not stored.",
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
