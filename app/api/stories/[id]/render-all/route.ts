import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getRuntime, startJob } from "@/lib/runtime";
import { stories, nodes } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  rt.db
    .update(stories)
    .set({ status: "rendering", updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, id))
    .run();
  const ns = rt.db
    .select()
    .from(nodes)
    .where(eq(nodes.storyId, id))
    .all()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .filter((node) => !node.imageId);
  const total = ns.length;
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "scene_render",
    fn: async (ctx) => {
      let done = 0;
      const errors: { nodeId: string; message: string }[] = [];
      for (const n of ns) {
        ctx.publish({ type: "progress", data: { current: done, total, nodeId: n.id } });
        try {
          await renderScene({
            db: rt.db,
            provider: rt.image,
            storageRoot: rt.storageRoot,
            nodeId: n.id,
            signal: ctx.signal,
          });
        } catch (err) {
          errors.push({
            nodeId: n.id,
            message: err instanceof Error ? err.message : String(err),
          });
        } finally {
          done += 1;
          ctx.publish({ type: "progress", data: { current: done, total, nodeId: n.id } });
        }
      }
      rt.db
        .update(stories)
        .set({ status: "done", updatedAt: sql`(unixepoch())` })
        .where(eq(stories.id, id))
        .run();
      return { total, errors };
    },
  });
  return NextResponse.json({ jobId, total });
}
