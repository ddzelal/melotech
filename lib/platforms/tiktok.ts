import { z } from "zod";
import type { PlatformDef } from "./types";

const schema = z.object({
  hook: z
    .string()
    .describe("One scroll-stopping line to caption the clip (max ~120 chars)"),
  hashtags: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 specific, trending-style hashtags (no leading '#')"),
});

export const tiktok: PlatformDef<typeof schema> = {
  id: "tiktok",
  label: "TikTok",
  icon: "Hash",
  accent: "pink",
  schema,
  buildPrompt: (concept) =>
    `You write TikTok captions for music clips. Output a hook + 3 hashtags.

Concept: "${concept}"

Rules:
- hook: one punchy, scroll-stopping line in a creator voice. Not a description — a hook.
- hashtags: exactly 3, specific to the sound/mood/niche. Avoid dead-generic tags
  like "music", "viral", "fyp" — prefer ones a real fan of this sound would follow.
- Return hashtags WITHOUT the leading '#'.`,
  display: [
    { key: "hook", label: "Hook", kind: "title" },
    { key: "hashtags", label: "Hashtags", kind: "tags" },
  ],
};
