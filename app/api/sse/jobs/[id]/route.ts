import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getRuntime } from "@/lib/runtime";
import { jobs } from "@/lib/db/schema";

export const runtime = "nodejs";

function pack(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rt = await getRuntime();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const job = rt.db.select().from(jobs).where(eq(jobs.id, id)).get();
      if (!job) {
        controller.enqueue(enc.encode(pack("error", { message: "job not found" })));
        controller.close();
        return;
      }
      if (job.status === "done" || job.status === "error" || job.status === "canceled") {
        controller.enqueue(
          enc.encode(
            pack(job.status === "done" ? "done" : "error", {
              status: job.status,
              error: job.error ?? null,
            }),
          ),
        );
        controller.close();
        return;
      }
      const unsub = rt.bus.subscribe(id, (e) => {
        controller.enqueue(enc.encode(pack(e.type, e.data)));
        if (e.type === "done" || e.type === "error") {
          controller.close();
          unsub();
        }
      });
    },
    cancel() {
      // Connection closed by client; leave job running.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
