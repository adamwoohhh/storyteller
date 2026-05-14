import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { jobs } from "@/lib/db/schema";

export const runtime = "nodejs";

function parseJobResult(result: string | null): unknown {
  if (!result) return undefined;
  try {
    return JSON.parse(result);
  } catch {
    return undefined;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();
  const job = rt.db.select().from(jobs).where(eq(jobs.id, id)).get();
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  return NextResponse.json({
    status: job.status,
    error: job.error,
    result: parseJobResult(job.result),
  });
}

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
