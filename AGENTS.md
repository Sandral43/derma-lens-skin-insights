<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Signed-in pages live under `src/routes/_authenticated/`; `_authenticated/_app/route.tsx` redirects to `/onboarding` until the profile is onboarded, and owns the bottom tab bar. Why: one place decides who sees the app shell.
- Browser data access goes through query options and mutations in `src/lib/data.ts` (RLS-protected Cloud client). Why: shared cache keys keep coins, streak and calendar in sync.
- Coin and streak rules live in `src/lib/progress.ts` with tests in `src/lib/progress.test.ts`; quest completions copy reward/period from the quest in a database trigger. Why: rewards can't be inflated from the browser.
- AI calls (buddy chat, face scan) run only in `src/lib/ai.functions.ts` server functions using structured JSON output. Why: keeps prompts, safety rules and keys server-side.
- Dermatologist search queries public OpenStreetMap sources (Overpass + Nominatim in parallel) from `src/lib/derm.functions.ts`. Why: no API key needed; either source may be slow.
- Skin photos are stored only in the private `skin-photos` bucket under `<user_id>/` and shown via signed URLs. Why: face photos must never be public.
- The buddy chick is an SVG component (`src/components/chick.tsx`) colored by design tokens. Why: crisp at any size and themeable.
