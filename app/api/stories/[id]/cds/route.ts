import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getRuntime, startJob } from "@/lib/runtime";
import { stories } from "@/lib/db/schema";
import { generateCDSText } from "@/lib/pipeline/character-design-text";

export const runtime = "nodejs";
const Body = z.object({
  artStyleKey: z.string().min(1),
  artStylePrompt: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { artStyleKey, artStylePrompt } = Body.parse(await req.json());
  const rt = await getRuntime();
  rt.db
    .update(stories)
    .set({
      artStyleKey,
      artStylePrompt,
      status: "style_done",
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(stories.id, id))
    .run();
  const jobId = await startJob({
    rt,
    storyId: id,
    kind: "cds_text",
    fn: async () => {
      await generateCDSText({ db: rt.db, provider: rt.text, storyId: id });
      rt.db
        .update(stories)
        .set({ status: "cds_done", updatedAt: sql`(unixepoch())` })
        .where(eq(stories.id, id))
        .run();
      return { ok: true };
    },
  });
  return NextResponse.json({ jobId });
}
