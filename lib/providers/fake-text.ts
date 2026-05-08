import type {
  TextProvider,
  StoryInput,
  NodeDraft,
  CDSDraft,
  ExtractedCharacter,
  StoryboardOpts,
  CDSGenArgs,
} from "./types";

export class FakeTextProvider implements TextProvider {
  async *generateStory(input: StoryInput): AsyncIterable<string> {
    const names = input.characters.map((c) => c.name).join("、") || "主角";
    const text =
      `从前，在${input.setting || "一个地方"}，${names}开始了旅程。${input.opening || ""}\n` +
      `他们经历了三段冒险，最终回到了起点。\n这是一个温暖的故事。`;
    for (const ch of text) {
      yield ch;
    }
  }

  async extractCharacters(storyText: string): Promise<ExtractedCharacter[]> {
    const candidates = ["小红", "小蓝", "小绿", "勇者", "公主"];
    const found = candidates
      .filter((n) => storyText.includes(n))
      .map((n) => ({ name: n, description: `从原文提取的角色：${n}` }))
      .slice(0, 3);
    if (found.length > 0) return found;
    return [{ name: "主角", description: "从原文提取的角色" }];
  }

  async generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]> {
    const segments = storyText.split(/[。.\n]+/).map((s) => s.trim()).filter(Boolean);
    const target = Math.min(
      Math.max(opts.targetMin, segments.length || opts.targetMin),
      opts.targetMax,
    );
    const ids = opts.characters.map((c) => c.id);
    return Array.from({ length: target }, (_, i) => ({
      order_index: i,
      text: segments[i] ?? `片段 ${i + 1}`,
      image_prompt: `画面 ${i + 1}：${segments[i] ?? "场景"}`,
      characters: ids,
    }));
  }

  async generateCDS(args: CDSGenArgs): Promise<CDSDraft[]> {
    return args.characters.map((c) => ({
      characterId: c.id,
      appearance: `${c.name} 的外貌（fake）`,
      outfit: `${c.name} 的服饰（fake）`,
      traits: `${c.name} 的特征（fake）`,
      style: `${c.name} 的风格（fake，遵循 ${args.artStylePrompt.slice(0, 20)}…）`,
    }));
  }
}
