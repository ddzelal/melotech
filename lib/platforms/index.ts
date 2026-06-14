import type { PlatformDef } from "./types";
import { spotify } from "./spotify";
import { tiktok } from "./tiktok";
import { youtube } from "./youtube";

/**
 * Platform registry. Add a new platform by creating `lib/platforms/<id>.ts`
 * (see the `/add-platform` slash command) and registering it here.
 */
export const PLATFORMS = {
  spotify,
  tiktok,
  youtube,
} satisfies Record<string, PlatformDef>;

export type PlatformId = keyof typeof PLATFORMS;

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

export const PLATFORM_LIST: PlatformDef[] = Object.values(PLATFORMS);

export function getPlatform(id: string): PlatformDef | undefined {
  return (PLATFORMS as Record<string, PlatformDef>)[id];
}

export function isPlatformId(id: string): id is PlatformId {
  return id in PLATFORMS;
}

export type { PlatformDef, DisplayField, FieldKind } from "./types";
