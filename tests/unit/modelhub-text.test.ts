import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { ModelHubTextProvider } from "@/lib/providers/modlehub-text";

const server = withMsw();

describe("ModelHubTextProvider", () => {
  it("posts chat completions to the ModelHub crawl endpoint with ak query", async () => {
    server.use(
      http.post("https://aidp.bytedance.net/api/modelhub/online/v2/crawl", async ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("ak")).toBe("mh-key");
        expect(request.headers.get("content-type")).toContain("application/json");
        expect(request.headers.get("x-tt-logid")).toBeTruthy();

        const body = (await request.json()) as { model: string; stream: boolean };
        expect(body.model).toBe("gpt-5.5-2026-04-24");
        expect(body.stream).toBe(false);

        return HttpResponse.json({
          choices: [{ message: { content: "从前，有一只狐狸。" } }],
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
