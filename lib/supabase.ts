import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client used by the API routes (server-side). It uses the publishable
 * key, so the `generations` table relies on RLS policies (see the migration).
 *
 * Returns `null` when env is not configured so the app degrades gracefully:
 * generation still works, only persistence/history/cache-fallback are skipped.
 */
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
          "not set — running without persistence (history & cache fallback disabled).",
      );
    }
    client = null;
    return client;
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
