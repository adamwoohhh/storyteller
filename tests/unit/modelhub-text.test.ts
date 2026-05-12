import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { ModelHubTextProvider } from "@/lib/providers/modlehub-text";

const server = withMsw();

describe("ModelHubTextProvider", () => {
  it("streams story completions from the ModelHub crawl endpoint with ak query", async () => {
    server.use(
      http.post("https://aidp.bytedance.net/api/modelhub/online/v2/crawl", async ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("ak")).toBe("mh-key");
        expect(request.headers.get("content-type")).toContain("application/json");
        expect(request.headers.get("x-tt-logid")).toBeTruthy();

        const body = (await request.json()) as { model: string; stream: boolean };
        expect(body.model).toBe("gpt-5.5-2026-04-24");
        expect(body.stream).toBe(true);

        const stream =
          `data: {"choices":[{"delta":{"content":"从前"}}]}\n\n` +
          `data: {"choices":[{"delta":{"content":"，有一只狐狸。"}}]}\n\n` +
          `data: [DONE]\n\n`;
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const provider = new ModelHubTextProvider({
      apiKey: "mh-key",
      model: "gpt-5.5-2026-04-24",
    });

    const out: string[] = [];
    for await (const c of provider.generateStory({ setting: "", characters: [], opening: "" })) {
      out.push(c);
    }

    expect(out.join("")).toBe("从前，有一只狐狸。");
  });
});
