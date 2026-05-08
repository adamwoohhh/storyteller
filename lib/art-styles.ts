export interface ArtStyle {
  id: string;
  name: string;
  prompt: string;
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
  { id: "custom", name: "自定义", prompt: "" },
];

export function getArtStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find((s) => s.id === id);
}

export function resolveArtStylePrompt(id: string, userAddition: string): string {
  if (id === "custom") return userAddition.trim();
  const base = getArtStyle(id)?.prompt ?? "";
  const extra = userAddition.trim();
  return extra ? `${base}. ${extra}` : base;
}
