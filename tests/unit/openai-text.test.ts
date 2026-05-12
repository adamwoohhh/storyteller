import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { withMsw } from "../helpers/msw";
import { OpenAITextProvider } from "@/lib/providers/openai-text";

const server = withMsw();

describe("OpenAITextProvider", () => {
  it("streams story text via chat.completions stream", async () => {
    server.use(
      http.post("https://api.openai.com/v1/chat/completions", async () => {
        const body =
          `data: {"choices":[{"delta":{"content":"从前"}}]}\n\n` +
          `data: {"choices":[{"delta":{"content":"，有"}}]}\n\n` +
          `data: [DONE]\n\n`;
        return new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const provider = new OpenAITextProvider({ apiKey: "k", model: "gpt-5" });
    const out: string[] = [];
    for await (const c of provider.generateStory({ setting: "", characters: [], opening: "" })) {
      out.push(c);
    }
    expect(out.join("")).toBe("从前，有");
  });

  it("parses storyboard from json response", async () => {
    server.use(
      http.post("https://api.openai.com/v1/chat/completions", async () =>
        HttpResponse.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  nodes: [
                    {
                      order_index: 0,
                      text: "a",
                      summary: "sa",
                      image_prompt: "p1",
                      characters: ["c1"],
                    },
                    { order_index: 1, text: "b", summary: "sb", image_prompt: "p2", characters: [] },
                  ],
                }),
              },
            },
          ],
        }),
      ),
    );
    const p = new OpenAITextProvider({ apiKey: "k", model: "gpt-5" });
    const r = await p.generateStoryboard("text", {
      mode: "paste",
      characters: [{ id: "c1", name: "x", description: "" }],
      targetMin: 2,
      targetMax: 4,
    });
    expect(r).toHaveLength(2);
    expect(r[0]?.text).toBe("a");
    expect(r[0]?.summary).toBe("sa");
  });
});
