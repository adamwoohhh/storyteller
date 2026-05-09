import type { ImageGenOpts, ImageProvider } from "./types";

const DEFAULT_IMAGE_BASE_URL =
  "https://aidp.bytedance.net/api/modelhub/online/v2/crawl/openai";
const DEFAULT_IMAGE_EDIT_BASE_URL =
  "https://aidp.bytedance.net/gpt/openapi/online/v2/crawl/openai";

type ImageResponse = { data?: { b64_json?: string | null }[] };

export class ModelHubImageProvider implements ImageProvider {
  private apiKey: string;
  private model: string;
  private baseURL: string;
  private editBaseURL: string;

  constructor(opts: { apiKey: string; model: string; baseURL?: string; editBaseURL?: string }) {
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.baseURL = opts.baseURL ?? DEFAULT_IMAGE_BASE_URL;
    this.editBaseURL = opts.editBaseURL ?? DEFAULT_IMAGE_EDIT_BASE_URL;
  }

  async generateImage(opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }> {
    const size = opts.size ?? "1024x1024";
    const data = opts.referenceImages?.length
      ? await this.editImage(opts, size)
      : await this.createImage(opts, size);
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("modelhub image request returned no b64_json");
    return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
  }

  private async createImage(opts: ImageGenOpts, size: string): Promise<ImageResponse> {
    const url = this.urlFor(this.baseURL, "/images/generations");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TT-LOGID": makeLogId(),
      },
      body: JSON.stringify({
        model: this.model,
        prompt: opts.prompt,
        n: 1,
        size,
      }),
      signal: opts.signal,
    });

    return parseImageResponse(response, "modelhub images.generate request failed");
  }

  private async editImage(opts: ImageGenOpts, size: string): Promise<ImageResponse> {
    const body = new FormData();
    opts.referenceImages?.forEach((image, index) => {
      const arrayBuffer = new ArrayBuffer(image.byteLength);
      new Uint8Array(arrayBuffer).set(image);
      const blob = new Blob([arrayBuffer], { type: "image/png" });
      body.append("image[]", blob, `ref-${index}.png`);
    });
    body.set("prompt", opts.prompt);
    body.set("model", this.model);
    body.set("size", size);
    body.set("n", "1");

    const response = await fetch(this.urlFor(this.editBaseURL, "/images/edits"), {
      method: "POST",
      headers: { "X-TT-LOGID": makeLogId() },
      body,
      signal: opts.signal,
    });

    return parseImageResponse(response, "modelhub images.edit request failed");
  }

  private urlFor(baseURL: string, path: string): URL {
    const url = new URL(`${baseURL.replace(/\/$/, "")}${path}`);
    url.searchParams.set("ak", this.apiKey);
    return url;
  }
}

async function parseImageResponse(response: Response, message: string): Promise<ImageResponse> {
  if (!response.ok) {
    throw new Error(`${message}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as ImageResponse;
}

function makeLogId(): string {
  return `storyteller-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
