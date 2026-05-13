import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRuntime } from "@/lib/runtime";
import { characters } from "@/lib/db/schema";
import { invalidateAfterCharacters } from "@/lib/pipeline/workflow-invalidation";

export const runtime = "nodejs";
const Patch = z.object({
  name: z.string().min(1).optional(),
  userInput: z.string().optional(),
  userImageId: z.string().nullable().optional(),
  cdsAppearance: z.string().optional(),
  cdsOutfit: z.string().optional(),
  cdsTraits: z.string().optional(),
  cdsStyle: z.string().optional(),
  confirmed: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = Patch.parse(await req.json());
  const { db } = await getRuntime();
  db.update(characters).set(body).where(eq(characters.id, id)).run();
  const row = db.select().from(characters).where(eq(characters.id, id)).get();
  if (row && ("name" in body || "userInput" in body || "userImageId" in body)) {
    invalidateAfterCharacters(db, row.storyId);
  }
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await getRuntime();
  const row = db.select().from(characters).where(eq(characters.id, id)).get();
  db.delete(characters).where(eq(characters.id, id)).run();
  if (row) invalidateAfterCharacters(db, row.storyId);
  return NextResponse.json({ ok: true });
}
