import { NextRequest, NextResponse } from "next/server";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryText } from "@/lib/pipeline/story-text";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "generate_story",
    fn: async (ctx) => {
      const out = await generateStoryText({
        db: rt.db,
        provider: rt.text,
        storyId: id,
        signal: ctx.signal,
        onChunk: (c) => ctx.publish({ type: "chunk", data: c }),
      });
      return { length: out.length };
    },
  });
  return NextResponse.json({ jobId });
}
