import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { assets } from "@/lib/db/schema";
import { readAssetFile } from "@/lib/storage/files";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const a = rt.db.select().from(assets).where(eq(assets.id, id)).get();
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  const bytes = await readAssetFile(rt.storageRoot, a.filePath);
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: { "Content-Type": a.mime, "Cache-Control": "private, max-age=3600" },
  });
}
