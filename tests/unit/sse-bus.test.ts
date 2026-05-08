import { describe, expect, it } from "vitest";
import { SseBus, type SseEvent } from "@/lib/jobs/sse-bus";

describe("SseBus", () => {
  it("delivers events to current subscribers", () => {
    const bus = new SseBus();
    const received: SseEvent[] = [];
    const unsub = bus.subscribe("j1", (e) => received.push(e));
    bus.publish("j1", { type: "chunk", data: "hello" });
    bus.publish("j1", { type: "done", data: { ok: true } });
    unsub();
    bus.publish("j1", { type: "chunk", data: "ignored" });
    expect(received).toEqual([
      { type: "chunk", data: "hello" },
      { type: "done", data: { ok: true } },
    ]);
  });

  it("isolates per-job channels", () => {
    const bus = new SseBus();
    const a: SseEvent[] = [];
    const b: SseEvent[] = [];
    bus.subscribe("a", (e) => a.push(e));
    bus.subscribe("b", (e) => b.push(e));
    bus.publish("a", { type: "chunk", data: "x" });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
  });

  it("buffers events delivered before any subscriber connects", () => {
    const bus = new SseBus();
    bus.publish("late", { type: "chunk", data: "first" });
    const got: SseEvent[] = [];
    bus.subscribe("late", (e) => got.push(e));
    expect(got).toEqual([{ type: "chunk", data: "first" }]);
  });
});
