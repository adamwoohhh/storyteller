import type { StoryInput, ReviseOpts, StoryboardOpts, CDSGenArgs } from "./types";

export const BASE_LANGUAGE_PROMPT = `使用用户偏好的语言（中文或英文）生成内容，保持与用户输入一致，除非用户明确要求改变语言`;

function withLanguageRule(prompt: string): string {
  return `${prompt}\n- ${BASE_LANGUAGE_PROMPT}`;
}

/**
 * 生成故事正文的系统提示词，目前设定为【中文儿童绘本作家】，后续对故事类型有要求时可优化这里
 */
export const STORY_SYSTEM = withLanguageRule(`你是一位儿童绘本作家，擅长把简单设定写成温暖、有画面感、起承转合分明的故事。要求：
- 叙述清晰、段落分明
- 根据故事剧情和场景切分为 4-12 个基础段落，段落之间用一个空行分隔
- 突出角色形象和场景细节，便于后续生成插图
- 不使用敏感、暴力或恐怖内容
- 直接输出故事正文，不要前后缀`);

/**
 * 把故事设定、角色信息、起始剧情拼接成用户提示词；
 * 如果是修改 prompt 重新生成的场景，则把上一稿故事和修改要求拼接成用户提示词
 */
export function buildStoryUser(input: StoryInput, revise?: ReviseOpts): string {
  if (revise) {
    return `这是上一稿故事：\n---\n${revise.previousStory}\n---\n请按以下要求修改并完整重写故事：${revise.revisePrompt}`;
  }
  const chars =
    input.characters.map((c) => `- ${c.name}：${c.description}`).join("\n") || "（用户未提供角色）";
  return `故事设定：${input.setting}\n角色：\n${chars}\n起始剧情：${input.opening}\n请据此创作完整故事，并按剧情与场景自然切分为 4-12 个基础段落。`;
}

/**
 * 故事分镜的系统提示词
 */
export const STORYBOARD_SYSTEM = withLanguageRule(
  `你是一位绘本分镜师。为每个故事段落设计一个画面节点：保留段落原文 text，写出整段总结或选取片段总结 summary，并附一段专为生图模型优化的 image_prompt（以视觉细节为主：构图/动作/表情/光线/场景）。`,
);

export function buildStoryboardUser(storyText: string, opts: StoryboardOpts): string {
  const charLines = opts.characters
    .map((c) => `- id: ${c.id}\n  name: ${c.name}\n  description: ${c.description}`)
    .join("\n");
  const ids = opts.characters.map((c) => c.id).join(", ") || "（无角色）";
  const first = opts.characters[0];
  const idExample = first
    ? `例如角色 ${first.name} 必须写 ${first.id}，不能写 ${first.id} ${first.name}，也不能只写 ${first.name}。`
    : "";
  const sliceRule =
    opts.mode === "paste"
      ? "节点 text 字段必须是原文的精确切片（连续字符），不得改写或扩写。"
      : "故事文本已经按基础段落切好；每个基础段落必须生成且只生成一个节点，text 字段必须保留对应段落原文，不得改写或扩写。";
  return `角色清单：\n${charLines}\n\ncharacters 字段只能填写角色 ID，必须从以下 ID 中选择：${ids}。\n${idExample}\n如果某个节点没有角色，characters 返回空数组 []。\n\n${sliceRule}\n目标节点数：${opts.targetMin}-${opts.targetMax}\n\n故事文本：\n${storyText}`;
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
            summary: { type: "string" },
            image_prompt: { type: "string" },
            characters: { type: "array", items: { type: "string" } },
          },
          required: ["order_index", "text", "summary", "image_prompt", "characters"],
        },
      },
    },
    required: ["nodes"],
  },
  strict: true,
};

// 角色提取
export const EXTRACT_SYSTEM = withLanguageRule(
  `从给定故事中提取主要角色（最多 5 个），每个角色给出名字和一两句外观/性格描述。`,
);
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

// 生成角色设计卡 CDS 提示词
export const CDS_SYSTEM = withLanguageRule(
  `为每个角色生成 Character Design Sheet（CDS）。每个角色四个字段（appearance/outfit/traits/style），描述要为后续生图模型友好：具体、可视、避免抽象词。所有 CDS 都要符合给定的全局画风。`,
);
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
