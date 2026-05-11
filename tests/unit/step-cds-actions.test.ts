import { describe, expect, it, vi } from "vitest";
import { saveAndRenderCharacter } from "@/app/s/[uuid]/_components/StepCDS/step-cds-actions";

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
