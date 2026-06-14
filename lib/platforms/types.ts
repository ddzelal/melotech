import type { z } from "zod";

/**
 * How a single field of a platform's output should render in the comparison view.
 * The UI is generic: it iterates `display` and renders each field by `kind`,
 * so adding a platform never requires touching the comparison component.
 */
export type FieldKind = "title" | "text" | "badge" | "tags" | "number";

export interface DisplayField {
  /** Key into the generated object (must match a field in the Zod schema). */
  key: string;
  label: string;
  kind: FieldKind;
}

export interface PlatformDef<S extends z.ZodObject = z.ZodObject> {
  /** Stable id used in the API payload and storage (`spotify`, `tiktok`, ...). */
  id: string;
  /** Human label for the UI. */
  label: string;
  /** lucide-react icon name. */
  icon: string;
  /** Tailwind accent (used for the platform card border/badge). */
  accent: string;
  /** Zod schema the LLM output is forced into via `generateObject`. */
  schema: S;
  /** Builds the platform-specific prompt from the raw music concept. */
  buildPrompt: (concept: string) => string;
  /** Ordered fields the comparison view renders. */
  display: DisplayField[];
}

/** Inferred output type for a platform. */
export type PlatformOutput<P extends PlatformDef> = z.infer<P["schema"]>;
