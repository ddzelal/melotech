import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { PlatformDef, PlatformOutput } from "../platforms/types";

/**
 * The @ai-sdk/google provider reads GOOGLE_GENERATIVE_AI_API_KEY by default,
 * but this project stores the key as GEMINI_API_KEY — bridge both names here.
 */
const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

/**
 * Generate a single platform's optimized output from a raw music concept.
 * Output is forced into the platform's Zod schema by `generateObject`, so the
 * caller gets a validated, typed object (or this throws on LLM/validation error).
 */
export async function generateForPlatform<P extends PlatformDef>(
  platform: P,
  concept: string,
): Promise<PlatformOutput<P>> {
  const { object } = await generateObject({
    model: google(MODEL),
    schema: platform.schema,
    prompt: platform.buildPrompt(concept),
  });
  return object as PlatformOutput<P>;
}

export { MODEL as GENERATION_MODEL };
