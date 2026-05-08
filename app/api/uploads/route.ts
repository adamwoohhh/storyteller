import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { assets, stories } from "@/lib/db/schema";
import { saveAssetFile } from "@/lib/storage/files";

export const runtime = "nodejs";
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const storyId = form.get("storyId");
  if (!(file instanceof File) || typeof storyId !== "string") {
    return NextResponse.json({ error: "file and storyId required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `unsupported mime ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (>5MB)" }, { status: 413 });
  }
  const rt = await getRuntime();
  const story = rt.db.select().from(stories).where(eq(stories.id, storyId)).get();
  if (!story) return NextResponse.json({ error: "story not found" }, { status: 404 });
  const assetId = randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  const filePath = await saveAssetFile({
    root: rt.storageRoot,
    storyId,
    assetId,
    mime: file.type,
    bytes,
  });
  rt.db
    .insert(assets)
    .values({ id: assetId, storyId, kind: "user_upload", filePath, mime: file.type })
    .run();
  return NextResponse.json({ assetId });
}
