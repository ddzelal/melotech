-- Melotech distribution pipeline — storage schema.
-- Apply via the Supabase MCP (`apply_migration`) or paste into the SQL editor.

-- Trigram matching powers the "return a cached similar result" fallback.
create extension if not exists pg_trgm;

create table if not exists public.generations (
  id          uuid primary key default gen_random_uuid(),
  prompt      text        not null,
  platform    text        not null,
  output      jsonb       not null,
  model       text        not null,
  from_cache  boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- History queries filter by platform, newest first.
create index if not exists generations_platform_created_idx
  on public.generations (platform, created_at desc);

-- Similarity search over prompts for the fallback.
create index if not exists generations_prompt_trgm_idx
  on public.generations using gin (prompt gin_trgm_ops);

-- Fallback lookup: the most similar prior *fresh* output for a platform.
-- Excludes from_cache rows so fallbacks never chain off each other.
create or replace function public.find_similar_generation(p_platform text, p_prompt text)
returns setof public.generations
language sql
stable
set search_path = ''
as $$
  select *
  from public.generations
  where platform = p_platform
    and not from_cache
    and public.similarity(prompt, p_prompt) > 0.1
  order by public.similarity(prompt, p_prompt) desc, created_at desc
  limit 1;
$$;

-- The API routes use the publishable (anon) key, so RLS must allow it.
-- This is demo-grade: writes are open. A production build would write with the
-- service-role key and keep these policies read-only (or removed entirely).
alter table public.generations enable row level security;

create policy "public read" on public.generations
  for select using (true);

create policy "public insert" on public.generations
  for insert with check (true);

-- Ensure the anon/authenticated roles can use the table and the fallback fn.
grant select, insert on public.generations to anon, authenticated;
grant execute on function public.find_similar_generation(text, text) to anon, authenticated;
