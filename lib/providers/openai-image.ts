import OpenAI, { toFile } from "openai";
import type { ImageProvider, ImageGenOpts } from "./types";

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI;
  private model: string;
  constructor(opts: { apiKey: string; model: string; baseURL?: string }) {
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL, maxRetries: 3 });
    this.model = opts.model;
  }

  async generateImage(opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }> {
    const size = opts.size ?? "1024x1024";
    if (opts.referenceImages?.length) {
      const files = await Promise.all(
        opts.referenceImages.map((b, i) => toFile(b, `ref-${i}.png`, { type: "image/png" })),
      );
      const r = await this.client.images.edit(
        { model: this.model, image: files, prompt: opts.prompt, size },
        { signal: opts.signal },
      );
      const b64 = r.data?.[0]?.b64_json;
      if (!b64) throw new Error("openai images.edit returned no b64_json");
      return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
    }
    const r = await this.client.images.generate(
      { model: this.model, prompt: opts.prompt, size },
      { signal: opts.signal },
    );
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error("openai images.generate returned no b64_json");
    return { bytes: Buffer.from(b64, "base64"), mime: "image/png" };
  }
}
