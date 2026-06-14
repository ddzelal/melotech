# Melotech — Distribution Pipeline

Turn one raw music concept into platform-optimized outputs, generated in parallel
and stored with history. Built for the [case study](./TASK.md).

- **Spotify** → full metadata (title, genre, mood, BPM, instruments, description)
- **TikTok** → a hook + 3 trending-style hashtags
- **YouTube** → SEO title + description + tags

> How AI coding tools were used to build this: **[AI_USAGE.md](./AI_USAGE.md)**.

## Stack

- **Next.js 16** (App Router) + React 19, TypeScript, Tailwind v4
- **Vercel AI SDK v6** + `@ai-sdk/google` (Gemini 2.5 Flash), with **Zod** schemas
  forcing structured output per platform
- **Supabase** (Postgres) for generation history + the cached-fallback lookup

## How it maps to the brief

| Requirement | Where |
| --- | --- |
| `POST { prompt, target_platforms }`, returns all simultaneously | `app/api/generate/route.ts` |
| Per-platform LLM output | `lib/platforms/*.ts` (schema + prompt + display) |
| Store results with metadata | `lib/store.ts` + `supabase/migrations/0001_init.sql` |
| History with platform filter | `app/api/history/route.ts`, UI in `app/page.tsx` |
| Rate limit — 3/min | `lib/rate-limit.ts` (returns `429` + `Retry-After`) |
| Graceful errors — cached similar result | `find_similar_generation()` via `lib/store.ts` |
| Multi-select + side-by-side compare | `app/page.tsx` |

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

### Environment

| Var | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini API key (the AI SDK provider) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (client-safe) key; the `generations` table is guarded by RLS policies |

Without the Supabase vars the app still **generates** — only history and the
cache-fallback are disabled (see `lib/supabase.ts`).

### Database

Apply [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) —
via the Supabase MCP (`apply_migration`) or by pasting it into the SQL editor. It
creates the `generations` table, indexes, the `pg_trgm` extension, and the
`find_similar_generation()` fallback function.

## Adding a platform

Melotech targets 50+ platforms, so this is a one-shot operation — run the
`/add-platform` Claude Code command (see `.claude/commands/`). It scaffolds the
Zod schema, prompt, and `display` config and registers the platform; the
comparison UI renders it with no further changes.
