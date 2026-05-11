import { describe, expect, it } from "vitest";
import {
  ADMIN_STORIES_HREF,
  getStoryDisplayTitle,
  getStoryModeAction,
} from "@/lib/story-navigation";

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
});
