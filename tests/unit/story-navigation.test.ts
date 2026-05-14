import { describe, expect, it } from "vitest";
import {
  ADMIN_STORIES_HREF,
  getStoryDisplayTitle,
  getStoryModeAction,
} from "@/lib/story-navigation";
import {
  getAccessibleWorkflowSteps,
  getCompletedWorkflowSteps,
  getCurrentWorkflowStep,
} from "@/lib/workflow-steps";

describe("story navigation helpers", () => {
  it("points admin entry links at the story admin page", () => {
    expect(ADMIN_STORIES_HREF).toBe("/admin/stories");
  });

  it("falls back to an unnamed story title", () => {
    expect(getStoryDisplayTitle("")).toBe("未命名故事");
    expect(getStoryDisplayTitle("  ")).toBe("未命名故事");
    expect(getStoryDisplayTitle("龟兔赛跑")).toBe("龟兔赛跑");
  });

  it("describes the opposite mode action", () => {
    expect(getStoryModeAction("edit")).toEqual({ label: "阅读态", mode: "read" });
    expect(getStoryModeAction("read")).toEqual({ label: "编辑态", mode: "edit" });
  });

  it("allows completed and current workflow steps only", () => {
    const state = { status: "text_done", inputMode: "paste", characterCount: 3 };

    expect(getCompletedWorkflowSteps(state)).toEqual(["story"]);
    expect(getCurrentWorkflowStep(state)).toBe("storyboard");
    expect(getAccessibleWorkflowSteps(state)).toEqual(["story", "storyboard"]);
  });

  it("does not expose a separate character confirmation step", () => {
    const state = { status: "text_done", inputMode: "structured", characterCount: 1 };

    expect(getCompletedWorkflowSteps(state)).toEqual(["story"]);
    expect(getCurrentWorkflowStep(state)).toBe("storyboard");
  });

  it("moves from story text to storyboard even when no characters are present", () => {
    const state = { status: "text_done", inputMode: "structured", characterCount: 0 };

    expect(getCompletedWorkflowSteps(state)).toEqual(["story"]);
    expect(getCurrentWorkflowStep(state)).toBe("storyboard");
    expect(getAccessibleWorkflowSteps(state)).toEqual(["story", "storyboard"]);
  });

  it("does not include character confirmation once storyboard exists", () => {
    const state = { status: "storyboard_done", inputMode: "paste", characterCount: 0 };

    expect(getCompletedWorkflowSteps(state)).toEqual(["story", "storyboard"]);
    expect(getCurrentWorkflowStep(state)).toBe("style");
  });
});
