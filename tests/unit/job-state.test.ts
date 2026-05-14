import { describe, expect, it } from "vitest";
import { jobSnapshotToState } from "@/lib/client/job-state";

describe("jobSnapshotToState", () => {
  it("keeps pending and running jobs active while polling", () => {
    expect(jobSnapshotToState({ status: "pending" })).toEqual({ status: "running", chunks: "" });
    expect(jobSnapshotToState({ status: "running" })).toEqual({ status: "running", chunks: "" });
  });

  it("maps completed job snapshots to terminal client states", () => {
    expect(jobSnapshotToState({ status: "done", result: { ok: true } })).toEqual({
      status: "done",
      chunks: "",
      result: { ok: true },
    });
    expect(jobSnapshotToState({ status: "partial_error", error: "部分失败", result: [1] })).toEqual({
      status: "partial_error",
      chunks: "",
      error: "部分失败",
      result: [1],
    });
  });

  it("maps failed and canceled job snapshots to error states", () => {
    expect(jobSnapshotToState({ status: "error", error: "boom" })).toEqual({
      status: "error",
      chunks: "",
      error: "boom",
    });
    expect(jobSnapshotToState({ status: "canceled" })).toEqual({
      status: "error",
      chunks: "",
      error: "任务已取消",
    });
  });
});
