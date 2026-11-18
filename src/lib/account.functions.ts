import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in person's data, photos and account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Remove private photos first.
    const { data: files } = await supabase.storage.from("skin-photos").list(userId, { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from("skin-photos").remove(files.map((f) => `${userId}/${f.name}`));
    }
    await supabase.from("quest_completions").delete().eq("user_id", userId);
    await supabase.from("scans").delete().eq("user_id", userId);
    await supabase.from("quests").delete().eq("user_id", userId);
    await supabase.from("saved_products").delete().eq("user_id", userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("deleteMyAccount failed", error);
      return { ok: false as const, error: "We couldn't delete your account. Please try again." };
    }
    return { ok: true as const };
  });

/** Deletes all stored skin photos but keeps scan scores. */
export const deleteMyPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: files } = await supabase.storage.from("skin-photos").list(userId, { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from("skin-photos").remove(files.map((f) => `${userId}/${f.name}`));
    }
    await supabase.from("scans").update({ photo_path: null }).eq("user_id", userId);
    return { ok: true as const, removed: files?.length ?? 0 };
  });
