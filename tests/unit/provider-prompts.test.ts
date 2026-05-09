import { describe, expect, it } from "vitest";
import { buildStoryboardUser } from "@/lib/providers/prompts";

describe("provider prompts", () => {
  it("requires storyboard characters to use exact character ids only", () => {
    const prompt = buildStoryboardUser("兔叽叽和龟龟比赛。", {
      mode: "structured",
      targetMin: 1,
      targetMax: 2,
      characters: [
        {
          id: "char-rabbit",
          name: "兔叽叽",
          description: "白色小兔",
        },
      ],
    });

    expect(prompt).toContain("characters 字段只能填写角色 ID");
    expect(prompt).toContain("必须写 char-rabbit");
    expect(prompt).toContain("不能写 char-rabbit 兔叽叽");
  });
});
