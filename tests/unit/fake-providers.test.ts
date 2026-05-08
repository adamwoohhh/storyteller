import { describe, expect, it } from "vitest";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { FakeImageProvider } from "@/lib/providers/fake-image";

describe("fake providers", () => {
  it("streams story text", async () => {
    const t = new FakeTextProvider();
    const chunks: string[] = [];
    for await (const c of t.generateStory({
      setting: "森林",
      characters: [{ name: "小红", description: "" }],
      opening: "出发",
    })) {
      chunks.push(c);
    }
    const full = chunks.join("");
    expect(full.length).toBeGreaterThan(0);
    expect(full).toContain("小红");
  });

  it("returns deterministic storyboard", async () => {
    const t = new FakeTextProvider();
    const nodes = await t.generateStoryboard("片段一。片段二。片段三。", {
      mode: "paste",
      characters: [{ id: "c1", name: "X", description: "" }],
      targetMin: 3,
      targetMax: 5,
    });
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(nodes[0]?.text).toContain("片段");
  });

  it("returns CDS for each character", async () => {
    const t = new FakeTextProvider();
    const cds = await t.generateCDS({
      characters: [
        { id: "a", name: "A", description: "" },
        { id: "b", name: "B", description: "" },
      ],
      storyText: "x",
      artStylePrompt: "y",
    });
    expect(cds.map((c) => c.characterId).sort()).toEqual(["a", "b"]);
  });

  it("extracts characters from text", async () => {
    const t = new FakeTextProvider();
    const cs = await t.extractCharacters("从前有个小红和小蓝在森林。");
    expect(cs.length).toBeGreaterThan(0);
  });

  it("image provider returns 1x1 png", async () => {
    const i = new FakeImageProvider();
    const r = await i.generateImage({ prompt: "x" });
    expect(r.mime).toBe("image/png");
    expect(r.bytes.length).toBeGreaterThan(0);
  });
});
