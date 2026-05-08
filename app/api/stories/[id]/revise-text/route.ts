import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { generateStoryText } from "@/lib/pipeline/story-text";

export const runtime = "nodejs";
const Body = z.object({ revisePrompt: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { revisePrompt } = Body.parse(await req.json());
  const rt = await getRuntime();
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "revise_story",
    fn: async (ctx) => {
      await generateStoryText({
        db: rt.db,
        provider: rt.text,
        storyId: id,
        revisePrompt,
        signal: ctx.signal,
        onChunk: (c) => ctx.publish({ type: "chunk", data: c }),
      });
      return { ok: true };
    },
  });
  return NextResponse.json({ jobId });
}
