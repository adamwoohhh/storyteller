import type {
  CDSDraft,
  CDSGenArgs,
  ExtractedCharacter,
  NodeDraft,
  ReviseOpts,
  StoryboardOpts,
  StoryInput,
  TextProvider,
} from "./types";
import {
  buildCDSUser,
  buildStoryboardUser,
  buildStoryUser,
  CDS_SCHEMA,
  CDS_SYSTEM,
  EXTRACT_SCHEMA,
  EXTRACT_SYSTEM,
  STORY_SYSTEM,
  STORYBOARD_SCHEMA,
  STORYBOARD_SYSTEM,
} from "./prompts";

const DEFAULT_TEXT_BASE_URL = "https://aidp.bytedance.net/api/modelhub/online/v2/crawl";

type ChatMessage = { role: "system" | "user"; content: string };
type ChatResponse = { choices?: { message?: { content?: string | null } }[] };

export class ModelHubTextProvider implements TextProvider {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(opts: { apiKey: string; model: string; baseURL?: string }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.baseURL = opts.baseURL ?? DEFAULT_TEXT_BASE_URL;
  }

  async *generateStory(
    input: StoryInput,
    opts?: { revise?: ReviseOpts },
  ): AsyncIterable<string> {
    const content = await this.chat([
      { role: "system", content: STORY_SYSTEM },
      { role: "user", content: buildStoryUser(input, opts?.revise) },
    ]);
    if (content) yield content;
  }

  async extractCharacters(storyText: string): Promise<ExtractedCharacter[]> {
    const content = await this.chat(
      [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: storyText },
      ],
      EXTRACT_SCHEMA,
    );
    const parsed = JSON.parse(content || "{}") as { characters?: ExtractedCharacter[] };
    return parsed.characters ?? [];
  }

  async generateStoryboard(storyText: string, opts: StoryboardOpts): Promise<NodeDraft[]> {
    const content = await this.chat(
      [
        { role: "system", content: STORYBOARD_SYSTEM },
        { role: "user", content: buildStoryboardUser(storyText, opts) },
      ],
      STORYBOARD_SCHEMA,
    );
    const parsed = JSON.parse(content || "{}") as { nodes?: NodeDraft[] };
    const nodes = parsed.nodes ?? [];
    return nodes.map((n, i) => ({ ...n, order_index: i }));
  }

  async generateCDS(args: CDSGenArgs): Promise<CDSDraft[]> {
    const content = await this.chat(
      [
        { role: "system", content: CDS_SYSTEM },
        { role: "user", content: buildCDSUser(args) },
      ],
      CDS_SCHEMA,
    );
    const parsed = JSON.parse(content || "{}") as { characters?: CDSDraft[] };
    return parsed.characters ?? [];
  }

  private async chat(messages: ChatMessage[], responseSchema?: unknown): Promise<string> {
    const url = new URL(this.baseURL);
    url.searchParams.set("ak", this.apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TT-LOGID": makeLogId(),
      },
      body: JSON.stringify({
        stream: false,
        model: this.model,
        messages,
        ...(responseSchema
          ? { response_format: { type: "json_schema", json_schema: responseSchema } }
          : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`modelhub chat request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as ChatResponse;
    return data.choices?.[0]?.message?.content ?? "";
  }
}

function makeLogId(): string {
  return `storyteller-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
