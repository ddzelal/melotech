# How AI coding tools were used

This project was built with **Claude Code** (Anthropic's CLI agent) driving the
implementation, with a human steering decisions and reviewing every change. This
document records *how* the AI was used — the harness, the integrations, and the
workflow — not just that it was.

## 1. Claude Code as the build harness

The whole pipeline (backend route, platform schemas, AI wrapper, rate limiter,
Supabase store, and the React UI) was implemented through Claude Code. The human
made the architectural calls (storage choice, where the AI-usage doc lives, build
order) via a short multiple-choice exchange before any code was written.

After every meaningful change the agent ran `tsc --noEmit`, `eslint`, and
`next build` and fixed what broke — e.g. the build surfaced two Next.js 16 /
React 19 lint rules (`set-state-in-effect`, `static-components`) and a removed
lucide icon (`Youtube`), all of which were corrected before moving on.

## 2. Project guardrail: don't trust training data

`AGENTS.md` (loaded automatically as project context) states this is a Next.js
version with breaking changes and that the bundled docs in
`node_modules/next/dist/docs/` must be read before writing code. The agent
followed this: it read `01-app/01-getting-started/15-route-handlers.md` before
writing the route handlers, and **verified third-party APIs against the installed
packages instead of recalling them** —

- confirmed `ai@6` exports `generateObject` and `@ai-sdk/google@3` exports
  `createGoogleGenerativeAI`,
- discovered the provider expects `GOOGLE_GENERATIVE_AI_API_KEY` while this repo
  uses `GEMINI_API_KEY`, and bridged both names in `lib/ai/generate.ts`,
- listed the real Gemini model ids and the available `lucide-react` icon names.

This caught real mismatches that a from-memory implementation would have shipped.

## 3. MCP servers

Configured per-project in [`.mcp.json`](./.mcp.json) so the integration travels
with the repo:

| Server | Role in this project |
| --- | --- |
| **Supabase** (`mcp.supabase.com`) | Storage backend. Used to verify the project URL + publishable key against `.env.local`, apply [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) (the `generations` table, indexes, `pg_trgm`, and the `find_similar_generation()` fallback function), and run `get_advisors` — whose security lint flagged a mutable `search_path` on the function, which was then hardened (`set search_path = ''` + schema-qualified calls). The cached-fallback path was verified end to end through the MCP (forced an LLM failure → confirmed `from_cache: true`). |
| **Magic UI** (`@magicuidesign/mcp`) | Component source for polished UI primitives during frontend work. |
| **Playwright** (`@playwright/mcp`) | End-to-end verification: drive the real page (select platforms → generate → inspect the comparison view) instead of asserting from code alone. |

`.claude/settings.json` enables these servers and pre-allows the read-only ones to
cut permission prompts.

## 4. Custom slash commands

Committed under [`.claude/commands/`](./.claude/commands/) — reusable, because the
brief targets **50+ platforms**:

- **`/add-platform <name> [needs]`** — scaffolds a new platform end to end: a Zod
  schema tailored to that platform's real requirements, a platform-specific
  `buildPrompt`, and a `display` config, then registers it in
  `lib/platforms/index.ts` and lints. Because the comparison UI renders generically
  from `display`, a new platform needs **no UI changes**.
- **`/test-pipeline [concept]`** — smoke-tests `/api/generate` against the dev
  server, checks each platform's output, and fires 4 requests in a row to confirm
  the 3-per-minute rate limit returns `429`.

## 5. Subagent

[`.claude/agents/prompt-tuner.md`](./.claude/agents/prompt-tuner.md) — a focused
subagent that optimizes a single platform's `buildPrompt` for output quality and
schema reliability (e.g. forbidding generic TikTok hashtags like `#fyp`,
front-loading the YouTube search keyword). It is scoped to prompt text only and is
told to stop if the schema itself is the problem.

## 6. Key AI-assisted design decisions

- **`generateObject` + Zod over manual JSON parsing** — the LLM output is forced
  into each platform's schema and validated at the call site, so the route handler
  receives typed, valid objects or a thrown error to fall back on.
- **Generic, data-driven UI** — each platform declares a `display: DisplayField[]`;
  the comparison view iterates it, so platforms and UI never couple.
- **Graceful degradation everywhere** — `lib/supabase.ts` returns `null` when env
  is missing (app still generates, only history/cache are skipped); per-platform
  failures fall back to `find_similar_generation` and never fail the whole request.
- **Keys honored as provided** — the project uses Supabase's publishable key, so
  the schema relies on RLS policies (demo-grade open writes) rather than a
  service-role key; documented as such in the migration and README.

## 7. Where the human steered

- Chose Supabase (over MongoDB/SQLite) and a separate `AI_USAGE.md`.
- Swapped the Supabase project to a fresh one (isolated for this case study).
- Reviewed schema, prompts, and the fallback semantics (excluding cached rows from
  the similarity search so fallbacks don't chain).
