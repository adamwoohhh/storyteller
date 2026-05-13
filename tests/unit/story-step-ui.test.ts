import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../..", import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, root), "utf8");
}

describe("story step UI source contracts", () => {
  it("renders story text through the paragraph preview instead of a textarea", () => {
    const source = readProjectFile("app/s/[uuid]/_components/StepStoryText.tsx");

    expect(source).not.toContain("@/components/ui/textarea");
    expect(source).not.toContain("<Textarea");
    expect(source).toContain("<StoryParagraphPreview text={liveText}");
  });

  it("keeps storyboard original paragraph read-only and labels editable fields", () => {
    const source = readProjectFile("app/s/[uuid]/_components/StepStoryboard.tsx");

    expect(source).not.toContain("value={n.text}");
    expect(source).not.toContain("patch(n.id, { text:");
    expect(source).toContain("<Label htmlFor={`summary-${n.id}`}>段落总结</Label>");
    expect(source).toContain("<Label htmlFor={`image-prompt-${n.id}`}>画面提示词</Label>");
  });
});
