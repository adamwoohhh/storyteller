export interface ArtStyle {
  id: string;
  name: string;
  prompt?: string;
  structuredPrompt?: string[];
  previewImage?: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: "watercolor-picturebook",
    name: "水彩绘本",
    prompt:
      "soft watercolor children's book illustration, gentle pastel palette, hand-painted texture, light warm lighting, storybook composition, no text",
  },
  {
    id: "ghibli-anime",
    name: "吉卜力动画",
    prompt:
      "studio ghibli style hand-drawn anime, lush painterly backgrounds, soft cel shading, expressive characters, naturalistic lighting, no text",
  },
  {
    id: "american-comic",
    name: "美式漫画",
    prompt:
      "modern american comic illustration, bold inked outlines, dynamic poses, cel shading with halftone shadows, saturated colors, no text",
  },
  {
    id: "pixel-art",
    name: "像素风",
    prompt:
      "16-bit pixel art illustration, limited palette, crisp pixel edges, charming retro game aesthetic, no text",
  },
  {
    id: "oil-painting",
    name: "古典油画",
    prompt:
      "classical oil painting illustration, visible brush strokes, rich chiaroscuro lighting, museum quality, no text",
  },
  {
    id: "cinematic-cg",
    name: "写实电影 CG",
    prompt:
      "photorealistic 3D cinematic render, dramatic lighting, high detail, shallow depth of field, no text",
  },
  {
    id: "ink-wash",
    name: "水墨",
    prompt:
      "traditional chinese ink wash painting, fluid brush strokes, monochrome with subtle color washes, abundant negative space, no text",
  },
  {
    id: "fzk",
    name: "丰子恺",
    // prompt: "Chinese ink and wash literati painting, expressive brush lines, sparse composition with large blank space, muted earthy colors, rice paper texture, handwritten calligraphy inscription, red seal stamps, poetic rural life atmosphere, no text",
    structuredPrompt: [
      "画风：中国水墨、文人画、传统人物小品、古风插画",
      "笔触：毛笔勾线、写意、简练、线条有顿挫",
      "色彩：淡彩、低饱和、土色、墨绿、胭脂色",
      "材质：宣纸纹理、手绘墨迹、旧纸感",
      "构图：大量留白",
      "元素：乡村屋舍、草木、飞鸟",
      "氛围：含蓄、诗意、民俗、怀旧、人情味",
    ],
    previewImage: "/art-styles/fzk.png",
  },
  { id: "custom", name: "自定义", prompt: "" },
];

export function getArtStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find((s) => s.id === id);
}

export function resolveArtStylePrompt(id: string, userAddition: string): string {
  if (id === "custom") return userAddition.trim();
  const style = getArtStyle(id);
  const base = style?.structuredPrompt?.length
    ? style.structuredPrompt.join("\n")
    : (style?.prompt ?? "");
  const extra = userAddition.trim();
  return extra ? `${base}. ${extra}` : base;
}
