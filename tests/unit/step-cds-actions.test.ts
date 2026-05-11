import { describe, expect, it, vi } from "vitest";
import {
  getCharactersNeedingCDSImage,
  hasCompleteCDSDraft,
  saveAndRenderCharacter,
  startBatchRenderCharacters,
} from "@/app/s/[uuid]/_components/StepCDS/step-cds-actions";

describe("saveAndRenderCharacter", () => {
  it("saves the edited CDS draft before starting image render", async () => {
    const calls: string[] = [];
    const patchCharacter = vi.fn(async () => {
      calls.push("patch");
    });
    const renderCharacter = vi.fn(async () => {
      calls.push("render");
      return { jobId: "job-1" };
    });

    const result = await saveAndRenderCharacter({
      characterId: "char-1",
      draft: {
        cdsAppearance: "round face",
        cdsOutfit: "red cape",
        cdsTraits: "brave",
        cdsStyle: "storybook",
      },
      patchCharacter,
      renderCharacter,
    });

    expect(result).toEqual({ jobId: "job-1" });
    expect(patchCharacter).toHaveBeenCalledWith("char-1", {
      cdsAppearance: "round face",
      cdsOutfit: "red cape",
      cdsTraits: "brave",
      cdsStyle: "storybook",
    });
    expect(renderCharacter).toHaveBeenCalledWith("char-1");
    expect(calls).toEqual(["patch", "render"]);
  });
});

describe("hasCompleteCDSDraft", () => {
  it("requires all CDS prompt fields before the card is editable", () => {
    expect(
      hasCompleteCDSDraft({
        cdsAppearance: "round face",
        cdsOutfit: "red cape",
        cdsTraits: "brave",
        cdsStyle: "storybook",
      }),
    ).toBe(true);

    expect(
      hasCompleteCDSDraft({
        cdsAppearance: "round face",
        cdsOutfit: "",
        cdsTraits: "brave",
        cdsStyle: "storybook",
      }),
    ).toBe(false);
  });
});

describe("getCharactersNeedingCDSImage", () => {
  it("keeps only prompt-ready characters without a CDS image", () => {
    const characters = [
      {
        id: "char-1",
        cdsAppearance: "round face",
        cdsOutfit: "red cape",
        cdsTraits: "brave",
        cdsStyle: "storybook",
        cdsImageId: null,
      },
      {
        id: "char-2",
        cdsAppearance: "tall",
        cdsOutfit: "",
        cdsTraits: "kind",
        cdsStyle: "storybook",
        cdsImageId: null,
      },
      {
        id: "char-3",
        cdsAppearance: "small",
        cdsOutfit: "blue coat",
        cdsTraits: "quiet",
        cdsStyle: "storybook",
        cdsImageId: "asset-1",
      },
    ];

    expect(getCharactersNeedingCDSImage(characters).map((c) => c.id)).toEqual(["char-1"]);
  });
});

describe("startBatchRenderCharacters", () => {
  it("starts a render job for every prompt-ready character missing an image", async () => {
    const renderCharacter = vi.fn(async (characterId: string) => ({
      jobId: `job-${characterId}`,
    }));

    const result = await startBatchRenderCharacters({
      characters: [
        {
          id: "char-1",
          cdsAppearance: "round face",
          cdsOutfit: "red cape",
          cdsTraits: "brave",
          cdsStyle: "storybook",
          cdsImageId: null,
        },
        {
          id: "char-2",
          cdsAppearance: "",
          cdsOutfit: "green coat",
          cdsTraits: "bold",
          cdsStyle: "storybook",
          cdsImageId: null,
        },
        {
          id: "char-3",
          cdsAppearance: "small",
          cdsOutfit: "blue coat",
          cdsTraits: "quiet",
          cdsStyle: "storybook",
          cdsImageId: "asset-1",
        },
      ],
      renderCharacter,
    });

    expect(renderCharacter).toHaveBeenCalledTimes(1);
    expect(renderCharacter).toHaveBeenCalledWith("char-1");
    expect(result).toEqual([{ characterId: "char-1", jobId: "job-char-1" }]);
  });

  it("saves edited drafts before starting batch render jobs", async () => {
    const calls: string[] = [];
    const patchCharacter = vi.fn(async (characterId: string) => {
      calls.push(`patch:${characterId}`);
    });
    const renderCharacter = vi.fn(async (characterId: string) => {
      calls.push(`render:${characterId}`);
      return { jobId: `job-${characterId}` };
    });

    await startBatchRenderCharacters({
      characters: [
        {
          id: "char-1",
          cdsAppearance: "old face",
          cdsOutfit: "old outfit",
          cdsTraits: "old traits",
          cdsStyle: "old style",
          cdsImageId: null,
        },
      ],
      drafts: {
        "char-1": {
          cdsAppearance: "new face",
          cdsOutfit: "new outfit",
          cdsTraits: "new traits",
          cdsStyle: "new style",
        },
      },
      patchCharacter,
      renderCharacter,
    });

    expect(patchCharacter).toHaveBeenCalledWith("char-1", {
      cdsAppearance: "new face",
      cdsOutfit: "new outfit",
      cdsTraits: "new traits",
      cdsStyle: "new style",
    });
    expect(calls).toEqual(["patch:char-1", "render:char-1"]);
  });
});
