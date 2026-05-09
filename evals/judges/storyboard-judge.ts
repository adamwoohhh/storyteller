import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import type { TextProvider } from "../../lib/providers/types";
import type { CaseScore, Report } from "./types";

const JUDGE_SYSTEM = `你是分镜评测员。对给定的分镜节点列表打分（0-10 整数）：
1. 节点数合理性 nodeCount
2. image_prompt 视觉信息密度 visualDensity
3. 角色出场覆盖（主要角色每段都有合理露出）characterCoverage
仅输出 JSON。`;

const JUDGE_SCHEMA = {
  name: "Score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      nodeCount: { type: "integer", minimum: 0, maximum: 10 },
      visualDensity: { type: "integer", minimum: 0, maximum: 10 },
      characterCoverage: { type: "integer", minimum: 0, maximum: 10 },
      notes: { type: "string" },
    },
    required: ["nodeCount", "visualDensity", "characterCoverage", "notes"],
  },
  strict: true,
};

interface CaseInput {
  id: string;
  storyText: string;
  characters: { id: string; name: string; description: string }[];
}

export async function runStoryboardEval(provider: TextProvider): Promise<Report> {
  const judge = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const judgeModel = process.env.EVAL_JUDGE_MODEL ?? "gpt-5";
  const dir = path.join("evals", "cases", "storyboard");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  const cases: CaseScore[] = [];

  for (const f of files) {
    const c = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as CaseInput;
    const nodes = await provider.generateStoryboard(c.storyText, {
      mode: "paste",
      characters: c.characters,
      targetMin: 6,
      targetMax: 12,
    });
    const r = await judge.chat.completions.create({
      model: judgeModel,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: { type: "json_schema", json_schema: JUDGE_SCHEMA as any },
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        {
          role: "user",
          content: `原文：\n${c.storyText}\n\n角色：${JSON.stringify(c.characters)}\n\n分镜：\n${JSON.stringify(
            nodes,
            null,
            2,
          )}`,
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
  return { stage: "storyboard", total: { mean, n: all.length }, cases };
}
