import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { ModelHubImageProvider } from "@/lib/providers/modelhub-image";

const server = withMsw();
const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");

describe("ModelHubImageProvider", () => {
  it("calls ModelHub images.generate with ak query when no reference images", async () => {
    server.use(
      http.post(
        "https://aidp.bytedance.net/api/modelhub/online/v2/crawl/openai/images/generations",
        async ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("ak")).toBe("mh-key");
          expect(request.headers.get("x-tt-logid")).toBeTruthy();

          const body = (await request.json()) as { model: string; prompt: string; size: string };
          expect(body.model).toBe("gpt-image-2");
          expect(body.prompt).toBe("a fox");
          expect(body.size).toBe("1024x1024");

          return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
        },
      ),
    );

    const provider = new ModelHubImageProvider({ apiKey: "mh-key", model: "gpt-image-2" });
    const r = await provider.generateImage({ prompt: "a fox" });

    expect(r.mime).toBe("image/png");
    expect(r.bytes.length).toBeGreaterThan(0);
  });

  it("calls ModelHub images.edits with multipart form when reference images present", async () => {
    let hit = false;
    server.use(
      http.post(
        "https://aidp.bytedance.net/gpt/openapi/online/v2/crawl/openai/images/edits",
        async ({ request }) => {
          hit = true;
          const url = new URL(request.url);
          expect(url.searchParams.get("ak")).toBe("mh-key");
          expect(request.headers.get("content-type")).toContain("multipart/form-data");

          const body = await request.formData();
          expect(body.get("model")).toBe("gpt-image-2");
          expect(body.get("prompt")).toBe("with this fox");
          expect(body.get("size")).toBe("1024x1024");
          expect(body.getAll("image[]")).toHaveLength(1);

          return HttpResponse.json({ data: [{ b64_json: PNG_B64 }] });
        },
      ),
    );

    const provider = new ModelHubImageProvider({ apiKey: "mh-key", model: "gpt-image-2" });
    const r = await provider.generateImage({
      prompt: "with this fox",
      referenceImages: [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    });

    expect(hit).toBe(true);
    expect(r.bytes.length).toBeGreaterThan(0);
  });
});
