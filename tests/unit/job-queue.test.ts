import { describe, expect, it } from "vitest";
import { JobQueue } from "@/lib/jobs/queue";

describe("JobQueue", () => {
  it("enforces concurrency limit", async () => {
    const q = new JobQueue({ concurrency: 2 });
    let active = 0;
    let peak = 0;
    const make = () => async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
    };
    await Promise.all([
      q.enqueue("1", make()),
      q.enqueue("2", make()),
      q.enqueue("3", make()),
      q.enqueue("4", make()),
    ]);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("supports cancellation via abort signal", async () => {
    const q = new JobQueue({ concurrency: 1 });
    let started = false;
    const p = q.enqueue("j1", async (signal) => {
      started = true;
      await new Promise((res, rej) => {
        const t = setTimeout(res, 200);
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          rej(new Error("aborted"));
        });
      });
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(started).toBe(true);
    q.cancel("j1");
    await expect(p).rejects.toThrow(/abort/i);
  });
});
