import type { StoryInput, ReviseOpts, StoryboardOpts, CDSGenArgs } from "./types";

export const STORY_SYSTEM = `你是一位中文儿童绘本作家，擅长把简单设定写成温暖、有画面感、起承转合分明的故事。要求：
- 叙述清晰、段落分明
- 突出角色形象和场景细节，便于后续生成插图
- 不使用敏感、暴力或恐怖内容
- 直接输出故事正文，不要前后缀`;

export function buildStoryUser(input: StoryInput, revise?: ReviseOpts): string {
  if (revise) {
    return `这是上一稿故事：\n---\n${revise.previousStory}\n---\n请按以下要求修改并完整重写故事：${revise.revisePrompt}`;
  }
  const chars =
    input.characters.map((c) => `- ${c.name}：${c.description}`).join("\n") || "（用户未提供角色）";
  return `故事设定：${input.setting}\n角色：\n${chars}\n起始剧情：${input.opening}\n请据此创作完整故事。`;
}

export const STORYBOARD_SYSTEM = `你是一位绘本分镜师。把给定故事文本切分成节点，每个节点附一段专为生图模型优化的英文 image_prompt（以视觉细节为主：构图/动作/表情/光线/场景）。`;

export function buildStoryboardUser(storyText: string, opts: StoryboardOpts): string {
  const charLines = opts.characters.map((c) => `- ${c.id} ${c.name}: ${c.description}`).join("\n");
  const sliceRule =
    opts.mode === "paste"
      ? "节点 text 字段必须是原文的精确切片（连续字符），不得改写或扩写。"
      : "节点 text 字段可以是原文段落或轻度润色。";
  return `角色清单：\n${charLines}\n\n${sliceRule}\n目标节点数：${opts.targetMin}-${opts.targetMax}\n\n故事文本：\n${storyText}`;
}

export const STORYBOARD_SCHEMA = {
  name: "Storyboard",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      nodes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            order_index: { type: "integer" },
            text: { type: "string" },
            image_prompt: { type: "string" },
            characters: { type: "array", items: { type: "string" } },
          },
          required: ["order_index", "text", "image_prompt", "characters"],
        },
      },
    },
    required: ["nodes"],
  },
  strict: true,
};

export const EXTRACT_SYSTEM = `从给定中文故事中提取主要角色（最多 5 个），每个角色给出名字和一两句外观/性格描述。`;
export const EXTRACT_SCHEMA = {
  name: "Characters",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, description: { type: "string" } },
          required: ["name", "description"],
        },
      },
    },
    required: ["characters"],
  },
  strict: true,
};

export const CDS_SYSTEM = `为每个角色生成 Character Design Sheet（CDS）。每个角色四个字段（appearance/outfit/traits/style），描述要为后续生图模型友好：具体、可视、避免抽象词。所有 CDS 都要符合给定的全局画风。`;
export function buildCDSUser(args: CDSGenArgs): string {
  const chars = args.characters.map((c) => `- ${c.id} ${c.name}: ${c.description}`).join("\n");
  return `画风：${args.artStylePrompt}\n角色：\n${chars}\n\n参考故事原文以保证一致性：\n${args.storyText}`;
}
export const CDS_SCHEMA = {
  name: "CDS",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      characters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            characterId: { type: "string" },
            appearance: { type: "string" },
            outfit: { type: "string" },
            traits: { type: "string" },
            style: { type: "string" },
          },
          required: ["characterId", "appearance", "outfit", "traits", "style"],
        },
      },
    },
    required: ["characters"],
  },
  strict: true,
};
