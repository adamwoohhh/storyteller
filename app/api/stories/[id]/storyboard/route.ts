import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryboard } from "@/lib/pipeline/storyboard";

export const runtime = "nodejs";
const Body = z.object({
  targetMin: z.number().int().min(2).max(20).default(6),
  targetMax: z.number().int().min(2).max(30).default(12),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { targetMin, targetMax } = Body.parse(await req.json().catch(() => ({})));
  const rt = await getRuntime();
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "storyboard",
    fn: async () =>
      generateStoryboard({ db: rt.db, provider: rt.text, storyId: id, targetMin, targetMax }),
  });
  return NextResponse.json({ jobId });
}
