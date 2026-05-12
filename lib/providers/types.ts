export interface StoryInput {
  setting: string;
  characters: { name: string; description: string }[];
  opening: string;
}

export interface NodeDraft {
  order_index: number;
  text: string;
  summary: string;
  image_prompt: string;
  characters: string[];
}

export interface CDSDraft {
  characterId: string;
  appearance: string;
  outfit: string;
  traits: string;
  style: string;
}

export interface ExtractedCharacter {
  name: string;
  description: string;
}

export interface StoryboardOpts {
  mode: "structured" | "paste";
  characters: { id: string; name: string; description: string }[];
  targetMin: number;
  targetMax: number;
}

export interface CDSGenArgs {
  characters: { id: string; name: string; description: string }[];
  storyText: string;
  artStylePrompt: string;
}

export interface ReviseOpts {
  previousStory: string;
  revisePrompt: string;
}

export interface TextProvider {
  generateStory(input: StoryInput, opts?: { revise?: ReviseOpts }): AsyncIterable<string>;
  extractCharacters(storyText: string): Promise<ExtractedCharacter[]>;
  generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]>;
  generateCDS(args: CDSGenArgs): Promise<CDSDraft[]>;
}

export interface ImageGenOpts {
  prompt: string;
  referenceImages?: Buffer[];
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  signal?: AbortSignal;
}

export interface ImageProvider {
  generateImage(opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }>;
}
