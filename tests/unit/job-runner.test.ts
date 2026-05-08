import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, jobs } from "@/lib/db/schema";
import { runJob } from "@/lib/jobs/runner";
import { JobQueue } from "@/lib/jobs/queue";
import { SseBus, type SseEvent } from "@/lib/jobs/sse-bus";
import { randomUUID } from "node:crypto";

describe("runJob", () => {
  it("runs job, marks done, emits events", async () => {
    const { db } = await makeTestDb();
    const storyId = randomUUID();
    db.insert(stories).values({ id: storyId, inputMode: "structured" }).run();
    const bus = new SseBus();
    const queue = new JobQueue({ concurrency: 1 });
    const events: SseEvent[] = [];
    const jobId = randomUUID();
    db.insert(jobs).values({ id: jobId, storyId, kind: "generate_story" }).run();
    bus.subscribe(jobId, (e) => events.push(e));
    await runJob({
      db,
      queue,
      bus,
      jobId,
      fn: async (ctx) => {
        ctx.publish({ type: "chunk", data: "hi" });
        return { ok: true };
      },
    });
    const row = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(row?.status).toBe("done");
    expect(events.some((e) => e.type === "chunk")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("marks job error on throw", async () => {
    const { db } = await makeTestDb();
    const storyId = randomUUID();
    db.insert(stories).values({ id: storyId, inputMode: "structured" }).run();
    const bus = new SseBus();
    const queue = new JobQueue({ concurrency: 1 });
    const jobId = randomUUID();
    db.insert(jobs).values({ id: jobId, storyId, kind: "generate_story" }).run();
    await expect(
      runJob({
        db,
        queue,
        bus,
        jobId,
        fn: async () => {
          throw new Error("boom");
        },
      }),
    ).rejects.toThrow();
    const row = db.select().from(jobs).where(eq(jobs.id, jobId)).get();
    expect(row?.status).toBe("error");
    expect(row?.error).toMatch(/boom/);
  });
});
