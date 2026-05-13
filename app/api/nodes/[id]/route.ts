import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { nodes } from "@/lib/db/schema";
import { invalidateAfterStoryboard } from "@/lib/pipeline/workflow-invalidation";

export const runtime = "nodejs";
const Patch = z.object({
  text: z.string().optional(),
  summary: z.string().optional(),
  imagePrompt: z.string().optional(),
  characters: z.array(z.string()).optional(),
  orderIndex: z.number().int().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = Patch.parse(await req.json());
  const { db } = await getRuntime();
  const update: Record<string, unknown> = { ...body };
  if (body.characters) update.characters = JSON.stringify(body.characters);
  db.update(nodes).set(update).where(eq(nodes.id, id)).run();
  const row = db.select().from(nodes).where(eq(nodes.id, id)).get();
  if (row && ("text" in body || "summary" in body || "imagePrompt" in body || "characters" in body)) {
    invalidateAfterStoryboard(db, row.storyId);
  }
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  const row = db.select().from(nodes).where(eq(nodes.id, id)).get();
  db.delete(nodes).where(eq(nodes.id, id)).run();
  if (row) invalidateAfterStoryboard(db, row.storyId);
  return NextResponse.json({ ok: true });
}
