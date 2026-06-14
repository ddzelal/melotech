import { getSupabase } from "./supabase";

/** One stored platform output. Mirrors the `generations` table. */
export interface GenerationRecord {
  id: string;
  prompt: string;
  platform: string;
  output: Record<string, unknown>;
  model: string;
  /** True when this row was served from the cache fallback, not a fresh LLM call. */
  from_cache: boolean;
  created_at: string;
}

export type NewGeneration = Pick<
  GenerationRecord,
  "prompt" | "platform" | "output" | "model" | "from_cache"
>;

const TABLE = "generations";

/** Persist a batch of platform outputs. No-op (returns []) when Supabase is unconfigured. */
export async function saveGenerations(
  rows: NewGeneration[],
): Promise<GenerationRecord[]> {
  const db = getSupabase();
  if (!db || rows.length === 0) return [];

  const { data, error } = await db.from(TABLE).insert(rows).select();
  if (error) {
    console.error("[store] saveGenerations failed:", error.message);
    return [];
  }
  return (data ?? []) as GenerationRecord[];
}

/** List history, newest first, optionally filtered by platform. */
export async function listGenerations(
  platform?: string,
  limit = 100,
): Promise<GenerationRecord[]> {
  const db = getSupabase();
  if (!db) return [];

  let query = db
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) {
    console.error("[store] listGenerations failed:", error.message);
    return [];
  }
  return (data ?? []) as GenerationRecord[];
}

/**
 * Find the most similar prior output for a platform — used as the graceful
 * fallback when a live LLM call fails. Backed by a Postgres function that uses
 * pg_trgm similarity; returns null when nothing similar enough exists.
 */
export async function findSimilar(
  platform: string,
  prompt: string,
): Promise<GenerationRecord | null> {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db.rpc("find_similar_generation", {
    p_platform: platform,
    p_prompt: prompt,
  });

  if (error) {
    console.error("[store] findSimilar failed:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as GenerationRecord) ?? null;
}
