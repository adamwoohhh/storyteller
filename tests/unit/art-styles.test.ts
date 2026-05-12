import { describe, expect, it } from "vitest";
import { ART_STYLES, getArtStyle, resolveArtStylePrompt } from "@/lib/art-styles";

describe("art-styles", () => {
  it("exports a list with stable ids", () => {
    const ids = ART_STYLES.map((s) => s.id);
    expect(ids).toContain("watercolor-picturebook");
    expect(ids).toContain("custom");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks up a style by id", () => {
    const s = getArtStyle("watercolor-picturebook");
    expect(s?.name).toBe("水彩绘本");
  });

  it("resolves a custom prompt", () => {
    expect(resolveArtStylePrompt("watercolor-picturebook", "warm tones")).toMatch(/watercolor/i);
    expect(resolveArtStylePrompt("watercolor-picturebook", "warm tones")).toContain("warm tones");
    expect(resolveArtStylePrompt("custom", "all custom")).toBe("all custom");
  });

  it("exposes structured prompt metadata and preview images", () => {
    const s = getArtStyle("fzk");
    expect(s?.structuredPrompt).toEqual(
      expect.arrayContaining(["画风：中国水墨、文人画、传统人物小品、古风插画"]),
    );
    expect(s?.previewImage).toBe("/art-styles/fzk.png");
  });

  it("resolves structured prompts before user additions", () => {
    const resolved = resolveArtStylePrompt("fzk", "偏暖色调");
    expect(resolved).toContain("画风：中国水墨、文人画、传统人物小品、古风插画");
    expect(resolved).toContain("\n");
    expect(resolved.endsWith("偏暖色调")).toBe(true);
  });
});
