import { z } from "zod";
import type { PlatformDef } from "./types";

const schema = z.object({
  title: z
    .string()
    .describe("SEO title, search keyword front-loaded (max ~70 chars)"),
  description: z
    .string()
    .describe("Description with a hook in the first line, then context (2–4 sentences)"),
  tags: z
    .array(z.string())
    .min(5)
    .max(12)
    .describe("Search tags covering keyword variations people actually type"),
});

export const youtube: PlatformDef<typeof schema> = {
  id: "youtube",
  label: "YouTube",
  icon: "PlayCircle",
  accent: "red",
  schema,
  buildPrompt: (concept) =>
    `You optimize YouTube music uploads for search. Output title, description, tags.

Concept: "${concept}"

Rules:
- title: front-load the main search keyword; keep it readable, not keyword soup.
- description: first line is a hook that earns the click; then 2–4 sentences of context.
- tags: 5–12 tags covering real search variations (genre, mood, use-case like
  "music for studying"), most important first.`,
  display: [
    { key: "title", label: "Title", kind: "title" },
    { key: "description", label: "Description", kind: "text" },
    { key: "tags", label: "Tags", kind: "tags" },
  ],
};
