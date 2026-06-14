import { z } from "zod";
import type { PlatformDef } from "./types";

const schema = z.object({
  title: z.string().describe("Release title for the track"),
  genre: z.string().describe("Primary genre, e.g. 'Synthwave', 'Lo-fi Hip Hop'"),
  mood: z.string().describe("One or two words capturing the mood"),
  bpm: z.number().int().min(40).max(220).describe("Tempo in beats per minute"),
  instruments: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Key instruments featured in the track"),
  description: z
    .string()
    .describe("A 1–2 sentence release blurb as it would appear on Spotify"),
});

export const spotify: PlatformDef<typeof schema> = {
  id: "spotify",
  label: "Spotify",
  icon: "Music",
  accent: "emerald",
  schema,
  buildPrompt: (concept) =>
    `You are a music metadata editor at a label that releases on Spotify.
Given a raw music concept, produce accurate, release-ready metadata.

Concept: "${concept}"

Rules:
- genre and mood must match the concept; do not default to generic "Pop".
- bpm must be plausible for the genre (e.g. lo-fi ~70-90, house ~120-128, DnB ~170).
- instruments: list the ones actually implied by the concept, most prominent first.
- description: a real release blurb, evocative but concrete — no marketing clichés like "a sonic journey".`,
  display: [
    { key: "title", label: "Title", kind: "title" },
    { key: "genre", label: "Genre", kind: "badge" },
    { key: "mood", label: "Mood", kind: "badge" },
    { key: "bpm", label: "BPM", kind: "number" },
    { key: "instruments", label: "Instruments", kind: "tags" },
    { key: "description", label: "Description", kind: "text" },
  ],
};
