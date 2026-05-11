import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import type { JobQueue } from "./queue";
import type { SseBus, SseEvent } from "./sse-bus";

export interface JobContext {
  db: DB;
  signal: AbortSignal;
  publish: (e: SseEvent) => void;
}

/**
 * 使用队列管理器执行一个任务，并根据任务执行状态修改 bd 中的记录，同时通过 sse bus 向前端推送任务执行的状态和结果
 */
export async function runJob<T>(args: {
  db: DB;
  queue: JobQueue;
  bus: SseBus;
  jobId: string;
  fn: (ctx: JobContext) => Promise<T>;
}): Promise<T> {
  const { db, queue, bus, jobId, fn } = args;
  let result!: T;
  let caught: unknown = null;

  await queue.enqueue(jobId, async (signal) => {
    // 更新 db 里的任务状态为 running
    db.update(jobs)
      .set({ status: "running", updatedAt: sql`(unixepoch())` })
      .where(eq(jobs.id, jobId))
      .run();
    try {
      result = await fn({ db, signal, publish: (e) => bus.publish(jobId, e) });
      db.update(jobs)
        .set({ status: "done", updatedAt: sql`(unixepoch())` })
        .where(eq(jobs.id, jobId))
        .run();
      bus.publish(jobId, { type: "done", data: result });
    } catch (err) {
      caught = err;
      const msg = err instanceof Error ? err.message : String(err);
      const status = signal.aborted ? "canceled" : "error";
      db.update(jobs)
        .set({ status, error: msg, updatedAt: sql`(unixepoch())` })
        .where(eq(jobs.id, jobId))
        .run();
      bus.publish(jobId, { type: "error", data: { message: msg } });
    } finally {
      bus.end(jobId);
    }
  });

  if (caught) throw caught;
  return result;
}
