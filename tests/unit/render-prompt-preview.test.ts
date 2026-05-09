import { describe, expect, it } from "vitest";
import { buildRenderPromptPreview } from "@/app/s/[uuid]/_components/render-prompt-preview";

describe("buildRenderPromptPreview", () => {
  it("builds the same prompt sections used for scene rendering", () => {
    const preview = buildRenderPromptPreview({
      story: { artStylePrompt: "soft watercolor" },
      node: {
        characters: JSON.stringify(["c1", "c2"]),
        imagePrompt: "rabbit wins the race near an oak tree",
      },
      characters: [
        {
          id: "c1",
          name: "小兔",
          cdsAppearance: "white rabbit",
          cdsOutfit: "red scarf",
          cdsTraits: "fast and cheerful",
          cdsStyle: "round chibi",
          cdsImageId: "asset-rabbit",
        },
        {
          id: "c2",
          name: "乌龟",
          cdsAppearance: "green turtle",
          cdsOutfit: "",
          cdsTraits: "steady",
          cdsStyle: "storybook",
          cdsImageId: null,
        },
      ],
    });

    expect(preview.artStylePrompt).toBe("soft watercolor");
    expect(preview.characterPrompt).toBe(
      "小兔: white rabbit, red scarf, fast and cheerful, round chibi | 乌龟: green turtle, steady, storybook",
    );
    expect(preview.imagePrompt).toBe("rabbit wins the race near an oak tree");
    expect(preview.finalPrompt).toBe(
      "soft watercolor\n\n小兔: white rabbit, red scarf, fast and cheerful, round chibi | 乌龟: green turtle, steady, storybook\n\nrabbit wins the race near an oak tree",
    );
    expect(preview.references).toEqual([
      { id: "c1", name: "小兔", cdsImageId: "asset-rabbit" },
      { id: "c2", name: "乌龟", cdsImageId: null },
    ]);
  });
});
