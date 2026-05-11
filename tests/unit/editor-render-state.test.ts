import { describe, expect, it } from "vitest";
import {
  isBulkSceneRendering,
  renderProgressLabel,
  shouldAutoStartSceneRender,
} from "@/app/s/[uuid]/_components/editor-render-state";

describe("editor render state", () => {
  it("auto-starts scene rendering only after CDS is done", () => {
    expect(shouldAutoStartSceneRender("cds_done")).toBe(true);
    expect(shouldAutoStartSceneRender("done")).toBe(false);
    expect(shouldAutoStartSceneRender("storyboard_done")).toBe(false);
  });

  it("marks the canvas as rendering while a render job is streaming", () => {
    expect(isBulkSceneRendering({ storyStatus: "done", jobId: "job-1", jobStatus: "running" }))
      .toBe(true);
    expect(isBulkSceneRendering({ storyStatus: "rendering", jobId: null })).toBe(true);
    expect(isBulkSceneRendering({ storyStatus: "done", jobId: null })).toBe(false);
  });

  it("formats streaming progress with the node count as a fallback", () => {
    expect(renderProgressLabel({ progress: { current: 2, total: 5 }, totalNodes: 3 })).toBe(
      "2 / 5",
    );
    expect(renderProgressLabel({ progress: undefined, totalNodes: 3 })).toBe("0 / 3");
  });
});
