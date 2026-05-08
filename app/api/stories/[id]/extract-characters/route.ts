import { NextRequest, NextResponse } from "next/server";
import { getRuntime, startJob } from "@/lib/runtime";
import { extractCharacters } from "@/lib/pipeline/character-extract";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "extract_chars",
    fn: async () => extractCharacters({ db: rt.db, provider: rt.text, storyId: id }),
  });
  return NextResponse.json({ jobId });
}
