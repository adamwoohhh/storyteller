import { describe, expect, it } from "vitest";
import { splitStoryParagraphs } from "@/lib/story-paragraphs";

describe("story paragraphs", () => {
  it("splits visible story paragraphs separated by blank lines or dividers", () => {
    expect(splitStoryParagraphs("第一段\n\n---\n\n第二段\n\n第三段")).toEqual([
      "第一段",
      "第二段",
      "第三段",
    ]);
  });
});
