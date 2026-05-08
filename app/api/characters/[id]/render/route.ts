import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { characters } from "@/lib/db/schema";
import { renderCDSImage } from "@/lib/pipeline/character-design-image";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const c = rt.db.select().from(characters).where(eq(characters.id, id)).get();
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  const jobId = await startJob({
    rt,
    storyId: c.storyId,
    kind: "cds_image",
    targetId: id,
    fn: async (ctx) =>
      renderCDSImage({
        db: rt.db,
        provider: rt.image,
        storageRoot: rt.storageRoot,
        characterId: id,
        signal: ctx.signal,
      }),
  });
  return NextResponse.json({ jobId });
}
