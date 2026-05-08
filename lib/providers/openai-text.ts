import OpenAI from "openai";
import type {
  TextProvider,
  StoryInput,
  NodeDraft,
  CDSDraft,
  ExtractedCharacter,
  StoryboardOpts,
  CDSGenArgs,
  ReviseOpts,
} from "./types";
import {
  STORY_SYSTEM,
  buildStoryUser,
  STORYBOARD_SYSTEM,
  buildStoryboardUser,
  STORYBOARD_SCHEMA,
  EXTRACT_SYSTEM,
  EXTRACT_SCHEMA,
  CDS_SYSTEM,
  buildCDSUser,
  CDS_SCHEMA,
} from "./prompts";

export class OpenAITextProvider implements TextProvider {
  private client: OpenAI;
  private model: string;
  constructor(opts: { apiKey: string; model: string; baseURL?: string }) {
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL, maxRetries: 3 });
    this.model = opts.model;
  }

  async *generateStory(
    input: StoryInput,
    opts?: { revise?: ReviseOpts },
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [
        { role: "system", content: STORY_SYSTEM },
        { role: "user", content: buildStoryUser(input, opts?.revise) },
      ],
    });
    for await (const ev of stream) {
      const delta = ev.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async extractCharacters(storyText: string): Promise<ExtractedCharacter[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_schema", json_schema: EXTRACT_SCHEMA as any },
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: storyText },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as {
      characters?: ExtractedCharacter[];
    };
    return parsed.characters ?? [];
  }

  async generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_schema", json_schema: STORYBOARD_SCHEMA as any },
      messages: [
        { role: "system", content: STORYBOARD_SYSTEM },
        { role: "user", content: buildStoryboardUser(storyText, opts) },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as { nodes?: NodeDraft[] };
    const nodes = parsed.nodes ?? [];
    return nodes.map((n, i) => ({ ...n, order_index: i }));
  }

  async generateCDS(args: CDSGenArgs): Promise<CDSDraft[]> {
    const r = await this.client.chat.completions.create({
      model: this.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_schema", json_schema: CDS_SCHEMA as any },
      messages: [
        { role: "system", content: CDS_SYSTEM },
        { role: "user", content: buildCDSUser(args) },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}") as {
      characters?: CDSDraft[];
    };
    return parsed.characters ?? [];
  }
}
