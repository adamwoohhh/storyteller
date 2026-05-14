import { describe, expect, it } from "vitest";
import {
  countRetryableSceneRenderFailures,
  isBulkSceneRendering,
  renderProgressLabel,
  shouldAutoStartSceneRender,
} from "@/app/s/[uuid]/_components/EditorCanvas/editor-render-state";

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
    expect(isBulkSceneRendering({ storyStatus: "done", jobId: "job-1", jobStatus: "partial_error" }))
      .toBe(false);
  });

  it("formats streaming progress with the node count as a fallback", () => {
    expect(renderProgressLabel({ progress: { current: 2, total: 5 }, totalNodes: 3 })).toBe(
      "2 / 5",
    );
    expect(renderProgressLabel({ progress: undefined, totalNodes: 3 })).toBe("0 / 3");
  });

  it("counts only failed scene render nodes that still do not have images", () => {
    expect(
      countRetryableSceneRenderFailures({
        result: {
          errors: [
            { nodeId: "missing-image", message: "failed" },
            { nodeId: "already-fixed", message: "failed earlier" },
            { nodeId: "unknown-node", message: "stale" },
          ],
        },
        nodes: [
          { id: "missing-image", imageId: null },
          { id: "already-fixed", imageId: "asset-1" },
        ],
      }),
    ).toBe(1);

    expect(countRetryableSceneRenderFailures({ result: { errors: [] }, nodes: [] })).toBe(0);
    expect(countRetryableSceneRenderFailures({ result: null, nodes: [] })).toBe(0);
  });
});
