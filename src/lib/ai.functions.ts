import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "openai/gpt-6.1-sol" as const;

const QUEST_ICON_VALUES = ["drop", "sparkle", "jar", "sun", "moon", "flask", "leaf", "mask", "eye", "hand"] as const;

function outputText(response: unknown): string {
  const out = (response as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> })
    .output;
  if (!Array.isArray(out)) return "";
  return out
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

function friendlyAiError(error: unknown): string {
  const name = (error as { name?: string })?.name ?? "";
  if (name === "RateLimitError") return "I'm getting lots of questions right now. Try again in a minute!";
  if (name === "PaymentRequiredError") return "My thinking cap needs a recharge. Please try again later.";
  return "Oops, I couldn't think of an answer just now. Please try again.";
}

// ---------- Chat with the buddy ----------

const chatInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1500) }))
    .min(1)
    .max(24),
});

export type ChatAction = {
  type: "add_quest" | "open_products" | "open_dermatologists";
  period: "morning" | "evening" | "none";
  title: string;
  product: string;
  icon: (typeof QUEST_ICON_VALUES)[number];
};

export type ChatResult =
  | { ok: true; reply: string; mood: "happy" | "joy" | "thinking" | "concerned"; actions: ChatAction[] }
  | { ok: false; error: string };

export const chatWithBuddy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data, context }): Promise<ChatResult> => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const petName = profile?.pet_name || "Sunny";
    const name = profile?.display_name || "friend";

    let contextBlock = "The user chose not to share their skin profile with you. Ask gentle questions if needed.";
    if (profile?.share_profile_with_pet !== false) {
      const [{ data: quests }, { data: scans }] = await Promise.all([
        supabase.from("quests").select("period, title, product").order("position"),
        supabase.from("scans").select("scanned_on, hydration, texture, clarity, summary").order("created_at", { ascending: false }).limit(1),
      ]);
      const scan = scans?.[0];
      contextBlock = [
        `Skin type: ${profile?.skin_type ?? "unknown"}`,
        `Goals: ${profile?.concerns?.join(", ") || "none given"}`,
        `Sensitivity: ${profile?.sensitivity ?? "unknown"}`,
        `Wants to avoid: ${profile?.avoid_ingredients?.join(", ") || "nothing"}`,
        `Morning routine: ${(quests ?? []).filter((q) => q.period === "morning").map((q) => `${q.title} (${q.product})`).join("; ") || "empty"}`,
        `Evening routine: ${(quests ?? []).filter((q) => q.period === "evening").map((q) => `${q.title} (${q.product})`).join("; ") || "empty"}`,
        scan
          ? `Last skin check (${scan.scanned_on}): hydration ${scan.hydration}, texture ${scan.texture}, clarity ${scan.clarity}. ${scan.summary}`
          : "No skin check yet.",
      ].join("\n");
    }

    const instructions = `You are ${petName}, a cheerful round yellow chick and the skincare buddy inside the DermaLens app. You are talking with ${name}.

Personality: warm, playful, encouraging, never shaming. Simple everyday words. Keep replies short: 2 to 4 sentences, under 90 words. No markdown; plain sentences, or when building a routine a very short numbered list with each step on its own line.

Safety rules (always follow):
- Share general skincare information only. You are not a doctor and do not diagnose, name a condition as a diagnosis, or recommend prescription medicines or doses.
- If the user describes anything concerning (a changing or bleeding mole or spot, painful or spreading rash, swelling, infection signs, severe or scarring acne, allergic reaction, or anything that worries them), kindly say a dermatologist should take a look, and include the open_dermatologists action.
- If asked something unsafe or off-topic, stay in character and gently steer back to skincare.
- Respect what the user wants to avoid and their sensitivity.

App actions you can offer (the user taps to confirm; never claim you already did them):
- add_quest: suggest adding a routine step. Fill period (morning or evening), a short fun title (max 30 chars, e.g. "Night treatment"), product (generic type, e.g. "Gentle retinol"), and an icon from: ${QUEST_ICON_VALUES.join(", ")}.
- open_products: when the user wants product ideas.
- open_dermatologists: when professional help is a good next step.
Offer at most 3 actions, only when genuinely helpful. For actions other than add_quest, set period to "none", title and product to "", icon to "sparkle".

mood: "happy" normally, "joy" for celebrating, "thinking" for explanations, "concerned" when recommending a professional.

What you know about the user:
${contextBlock}`;

    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const response = await generateResponse({
        model: MODEL,
        instructions,
        input: data.messages.map((m) =>
          m.role === "user"
            ? { role: "user" as const, content: m.content }
            : { role: "assistant" as const, content: [{ type: "output_text" as const, text: m.content }] },
        ),
        text: {
          format: {
            type: "json_schema",
            name: "buddy_reply",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["reply", "mood", "actions"],
              properties: {
                reply: { type: "string" },
                mood: { type: "string", enum: ["happy", "joy", "thinking", "concerned"] },
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "period", "title", "product", "icon"],
                    properties: {
                      type: { type: "string", enum: ["add_quest", "open_products", "open_dermatologists"] },
                      period: { type: "string", enum: ["morning", "evening", "none"] },
                      title: { type: "string" },
                      product: { type: "string" },
                      icon: { type: "string", enum: [...QUEST_ICON_VALUES] },
                    },
                  },
                },
              },
            },
          },
        },
      });
      const parsed = JSON.parse(outputText(response)) as {
        reply: string;
        mood: "happy" | "joy" | "thinking" | "concerned";
        actions: ChatAction[];
      };
      return {
        ok: true,
        reply: parsed.reply,
        mood: parsed.mood,
        actions: (parsed.actions ?? []).slice(0, 3).map((a) => ({
          ...a,
          title: a.title.slice(0, 60),
          product: a.product.slice(0, 80),
        })),
      };
    } catch (error) {
      console.error("chatWithBuddy failed", error);
      return { ok: false, error: friendlyAiError(error) };
    }
  });

// ---------- Face scan ----------

const scanInput = z.object({
  image: z
    .string()
    .max(3_000_000)
    .refine((s) => /^data:image\/(jpeg|png|webp);base64,/.test(s), "Unsupported image"),
});

export type ScanResult =
  | {
      ok: true;
      hydration: number;
      texture: number;
      clarity: number;
      summary: string;
      tips: string[];
      seeDermatologist: boolean;
      confidence: "low" | "medium" | "high";
    }
  | { ok: false; error: string };

export const analyzeSkin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scanInput.parse(input))
  .handler(async ({ data }): Promise<ScanResult> => {
    const prompt = `You are the friendly skin check-in helper for a cosmetic skincare app. This is NOT a medical exam.

Step 1, quality check: confirm the photo shows exactly one real human face, facing forward, reasonably well lit and in focus. If not, set ok=false and put a short, friendly fix in reason (e.g. "Try facing a window for softer light."). Scores then 0.

Step 2, if ok: estimate three cosmetic scores from 0 to 100:
- hydration: how plump and comfortable the skin looks (dry, flaky or tight-looking = lower).
- texture: how smooth the surface looks (higher = smoother).
- clarity: how even and calm the skin looks with few visible blemishes (higher = clearer).
Be fair across every skin tone: never score skin color, undertone, freckles, facial hair or makeup-free features as flaws. Lighting limits accuracy; reflect that in confidence.

summary: 1 to 2 warm sentences in plain words, no diagnosis, no condition names.
tips: 2 or 3 short, gentle, general skincare tips (under 15 words each).
see_dermatologist: true only if something visible seems worth a professional look (e.g. an unusual-looking spot or strong inflammation). Never diagnose.

Return JSON.`;
    try {
      const { generateResponse } = await import("@lovable.dev/ai-gateway");
      const response = await generateResponse({
        model: MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: data.image, detail: "auto" },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "skin_check",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["ok", "reason", "hydration", "texture", "clarity", "summary", "tips", "see_dermatologist", "confidence"],
              properties: {
                ok: { type: "boolean" },
                reason: { type: "string" },
                hydration: { type: "integer" },
                texture: { type: "integer" },
                clarity: { type: "integer" },
                summary: { type: "string" },
                tips: { type: "array", items: { type: "string" } },
                see_dermatologist: { type: "boolean" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
              },
            },
          },
        },
      });
      const r = JSON.parse(outputText(response)) as {
        ok: boolean;
        reason: string;
        hydration: number;
        texture: number;
        clarity: number;
        summary: string;
        tips: string[];
        see_dermatologist: boolean;
        confidence: "low" | "medium" | "high";
      };
      if (!r.ok) return { ok: false, error: r.reason || "I couldn't see your face clearly. Try again with better light." };
      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
      return {
        ok: true,
        hydration: clamp(r.hydration),
        texture: clamp(r.texture),
        clarity: clamp(r.clarity),
        summary: r.summary,
        tips: (r.tips ?? []).slice(0, 3),
        seeDermatologist: r.see_dermatologist,
        confidence: r.confidence,
      };
    } catch (error) {
      console.error("analyzeSkin failed", error);
      return { ok: false, error: friendlyAiError(error) };
    }
  });
