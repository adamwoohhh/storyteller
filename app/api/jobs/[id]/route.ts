import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { jobs } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  rt.queue.cancel(id);
  rt.db
    .update(jobs)
    .set({ status: "canceled", updatedAt: sql`(unixepoch())` })
    .where(eq(jobs.id, id))
    .run();
  return NextResponse.json({ ok: true });
}
