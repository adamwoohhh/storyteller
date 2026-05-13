import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { stories } from "@/lib/db/schema";
import { getActiveStoryBundle, logicallyDeleteStory } from "@/lib/stories/admin";
import { invalidateAfterStoryText } from "@/lib/pipeline/workflow-invalidation";

export const runtime = "nodejs";

/**
 * 查询故事，包括故事基本信息、角色、节点、素材等
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 从 params (path占位符) 中获取故事 id
  const { id } = await params;
  const { db } = await getRuntime();
  const bundle = getActiveStoryBundle(db, id);
  if (!bundle) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(bundle);
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
  if (body.storyText !== undefined) {
    invalidateAfterStoryText(db, id);
  }
  return NextResponse.json(db.select().from(stories).where(eq(stories.id, id)).get());
}

/**
 * 逻辑删除故事，保留数据库记录和关联数据
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  const result = logicallyDeleteStory(db, id);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
