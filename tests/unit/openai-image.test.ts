import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { OpenAIImageProvider } from "@/lib/providers/openai-image";

const server = withMsw();
const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");

describe("OpenAIImageProvider", () => {
  it("calls images.generate when no reference images", async () => {
    let endpoint = "";
    server.use(
      http.post("https://api.openai.com/v1/images/generations", async ({ request }) => {
        endpoint = "generations";
        const body = (await request.json()) as { model: string; prompt: string };
        expect(body.model).toBe("gpt-image-1");
        expect(body.prompt).toBe("a fox");
        return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
      }),
    );
    const p = new OpenAIImageProvider({ apiKey: "k", model: "gpt-image-1" });
    const r = await p.generateImage({ prompt: "a fox" });
    expect(endpoint).toBe("generations");
    expect(r.mime).toBe("image/png");
    expect(r.bytes.length).toBeGreaterThan(0);
  });

  it("calls images.edits when reference images present", async () => {
    let hit = false;
    server.use(
      http.post("https://api.openai.com/v1/images/edits", async () => {
        hit = true;
        return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
      }),
    );
    const p = new OpenAIImageProvider({ apiKey: "k", model: "gpt-image-1" });
    const ref = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const r = await p.generateImage({ prompt: "with this fox", referenceImages: [ref] });
    expect(hit).toBe(true);
    expect(r.bytes.length).toBeGreaterThan(0);
  });
});
