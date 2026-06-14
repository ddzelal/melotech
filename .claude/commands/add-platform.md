---
description: Scaffold a new distribution platform (Zod schema + LLM prompt + UI card) and register it
argument-hint: <platform-name> [one-line description of what this platform needs]
allowed-tools: Read, Write, Edit, Bash(pnpm lint), mcp__supabase__*
---

You are adding a new distribution platform to the Melotech pipeline. The platform is: **$ARGUMENTS**

Melotech distributes to 50+ platforms, each with its own output shape. This command makes adding the next one a one-shot operation.

## Steps

1. Read `lib/platforms/index.ts` and one existing platform (e.g. `lib/platforms/spotify.ts`) to learn the contract: each platform exports `{ id, label, schema, buildPrompt, display }`.
2. Create `lib/platforms/<id>.ts` for the new platform:
   - A **Zod schema** capturing exactly the fields this platform needs (be specific to the platform's real requirements — don't copy Spotify's fields blindly).
   - A `buildPrompt(concept: string)` that instructs the LLM to return that shape, with platform-appropriate tone/constraints.
   - A `display` config (label, icon name from `lucide-react`, and which fields render as title/body/tags) so the comparison view renders it with no extra UI work.
3. Register the new platform in `lib/platforms/index.ts`.
4. Run `pnpm lint` and fix any issues.
5. Report what fields you chose and why they fit this platform.

Keep schemas tight — every field must map to a genuine platform requirement. Do not touch unrelated platforms.
