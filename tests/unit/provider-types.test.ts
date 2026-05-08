import { describe, expect, it } from "vitest";
import type {
  TextProvider,
  ImageProvider,
  NodeDraft,
  CDSDraft,
  StoryInput,
} from "@/lib/providers/types";

describe("provider types", () => {
  it("compiles structurally", () => {
    const _draft: NodeDraft = { order_index: 0, text: "x", image_prompt: "y", characters: [] };
    const _cds: CDSDraft = {
      characterId: "c1",
      appearance: "",
      outfit: "",
      traits: "",
      style: "",
    };
    const _input: StoryInput = { setting: "", characters: [], opening: "" };
    const _t: TextProvider | null = null;
    const _i: ImageProvider | null = null;
    expect(_draft.order_index).toBe(0);
  });
});
