import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { stories, characters, nodes, assets } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * 查询故事，包括故事基本信息、角色、节点、素材等
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 从 params (path占位符) 中获取故事 id
  const { id } = await params;
  const { db } = await getRuntime();
  const story = db.select().from(stories).where(eq(stories.id, id)).get();
  if (!story) return NextResponse.json({ error: "not found" }, { status: 404 });
  const cs = db.select().from(characters).where(eq(characters.storyId, id)).all();
  const ns = db
    .select()
    .from(nodes)
    .where(eq(nodes.storyId, id))
    .all()
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const as = db.select().from(assets).where(eq(assets.storyId, id)).all();
  return NextResponse.json({ story, characters: cs, nodes: ns, assets: as });
}

const StoryPatch = z.object({
  storyText: z.string().optional(),
  title: z.string().optional(),
});

/**
 * 更新故事基础信息
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = StoryPatch.parse(await req.json());
  const { db } = await getRuntime();
  db.update(stories)
    .set({ ...body, updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, id))
    .run();
  return NextResponse.json(db.select().from(stories).where(eq(stories.id, id)).get());
}
