import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import type { TextProvider } from "../../lib/providers/types";
import type { CaseScore, Report } from "./types";

const JUDGE_SYSTEM = `你是绘本故事评测员。给一段中文故事在 4 个维度打分（0-10 整数）：
1. 连贯性 coherence
2. 角色一致性 characterConsistency
3. 起承转合 narrativeArc
4. 与用户输入贴合度 fidelityToInput
仅输出 JSON。`;

const JUDGE_SCHEMA = {
  name: "Score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      coherence: { type: "integer", minimum: 0, maximum: 10 },
      characterConsistency: { type: "integer", minimum: 0, maximum: 10 },
      narrativeArc: { type: "integer", minimum: 0, maximum: 10 },
      fidelityToInput: { type: "integer", minimum: 0, maximum: 10 },
      notes: { type: "string" },
    },
    required: ["coherence", "characterConsistency", "narrativeArc", "fidelityToInput", "notes"],
  },
  strict: true,
};

interface CaseInput {
  setting: string;
  characters: { name: string; description: string }[];
  opening: string;
}

export async function runStoryTextEval(provider: TextProvider): Promise<Report> {
  const judge = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "gpt-5";
  const dir = path.join("evals", "cases", "story-text");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const cases: CaseScore[] = [];

  for (const f of files) {
    const c = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as {
      id: string;
      input: CaseInput;
    };
    let story = "";
    for await (const chunk of provider.generateStory(c.input)) story += chunk;
    const r = await judge.chat.completions.create({
      model: judgeModel,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_schema", json_schema: JUDGE_SCHEMA as any },
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        {
          role: "user",
          content: `用户输入：\n${JSON.stringify(c.input)}\n\n生成的故事：\n${story}`,
        },
      ],
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content ?? "{}");
    cases.push({ case: c.id, scores: parsed, notes: parsed.notes });
  }

  const all = cases.flatMap((c) =>
    Object.entries(c.scores)
      .filter(([k]) => k !== "notes")
      .map(([, v]) => Number(v)),
  );
  const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  return { stage: "story-text", total: { mean, n: all.length }, cases };
}
