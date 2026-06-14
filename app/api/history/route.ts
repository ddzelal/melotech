import { listGenerations } from "@/lib/store";
import { isPlatformId } from "@/lib/platforms";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platformParam = searchParams.get("platform");
  const platform =
    platformParam && isPlatformId(platformParam) ? platformParam : undefined;

  const history = await listGenerations(platform);
  return Response.json({ platform: platform ?? "all", history });
}
