import { z } from "zod";
import { PLATFORM_IDS, getPlatform } from "@/lib/platforms";
import { generateForPlatform, GENERATION_MODEL } from "@/lib/ai/generate";
import { checkRateLimit, MAX_REQUESTS } from "@/lib/rate-limit";
import { saveGenerations, findSimilar, type NewGeneration } from "@/lib/store";

const RequestSchema = z.object({
  prompt: z.string().trim().min(3, "prompt is too short").max(2000),
  target_platforms: z
    .array(z.enum(PLATFORM_IDS as [string, ...string[]]))
    .min(1, "select at least one platform"),
});

type PlatformResult =
  | { platform: string; ok: true; from_cache: boolean; output: Record<string, unknown> }
  | { platform: string; ok: false; error: string };

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";
}

export async function POST(req: Request) {
  // 1. Parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { prompt, target_platforms } = parsed.data;

  // 2. Rate limit — max 3 generations per minute per client
  const limit = checkRateLimit(clientKey(req));
  if (!limit.ok) {
    return Response.json(
      {
        error: `Rate limit exceeded — max ${MAX_REQUESTS} generations per minute.`,
        retry_after: limit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // 3. Generate every requested platform in parallel; on failure fall back to a
  //    cached similar result so the response never half-fails the user.
  const results = await Promise.all(
    target_platforms.map(async (id): Promise<PlatformResult> => {
      const platform = getPlatform(id);
      if (!platform) return { platform: id, ok: false, error: "Unknown platform" };

      try {
        const output = await generateForPlatform(platform, prompt);
        return { platform: id, ok: true, from_cache: false, output };
      } catch (err) {
        console.error(`[generate] ${id} failed:`, err);
        const cached = await findSimilar(id, prompt);
        if (cached) {
          return { platform: id, ok: true, from_cache: true, output: cached.output };
        }
        return {
          platform: id,
          ok: false,
          error: "Generation failed and no cached result was available.",
        };
      }
    }),
  );

  // 4. Persist successful + cached outputs (fire-and-forget shape, but awaited
  //    so history is consistent on the next read).
  const toSave: NewGeneration[] = results
    .filter((r): r is Extract<PlatformResult, { ok: true }> => r.ok)
    .map((r) => ({
      prompt,
      platform: r.platform,
      output: r.output,
      model: GENERATION_MODEL,
      from_cache: r.from_cache,
    }));
  await saveGenerations(toSave);

  // 5. Return all platforms simultaneously
  return Response.json({
    prompt,
    model: GENERATION_MODEL,
    rate_limit: { remaining: limit.remaining, max: MAX_REQUESTS },
    results,
  });
}
