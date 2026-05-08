import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { nodes } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const n = rt.db.select().from(nodes).where(eq(nodes.id, id)).get();
  if (!n) return NextResponse.json({ error: "not found" }, { status: 404 });
  const jobId = await startJob({
    rt,
    storyId: n.storyId,
    kind: "scene_render",
    targetId: id,
    fn: async (ctx) =>
      renderScene({
        db: rt.db,
        provider: rt.image,
        storageRoot: rt.storageRoot,
        nodeId: id,
        signal: ctx.signal,
      }),
  });
  return NextResponse.json({ jobId });
}
