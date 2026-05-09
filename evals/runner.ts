import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../lib/config";
import { OpenAITextProvider } from "../lib/providers/openai-text";
import type { Report } from "./judges/types";
import { runStoryTextEval } from "./judges/story-text-judge";
import { runStoryboardEval } from "./judges/storyboard-judge";

const STAGE = process.argv[2] ?? "all";

async function main() {
  process.env.PROVIDER_MODE = "openai";
  const cfg = loadConfig();
  const provider = new OpenAITextProvider({
    apiKey: cfg.openai.apiKey,
    model: cfg.openai.textModel,
  });
  const reports: Report[] = [];
  if (STAGE === "story-text" || STAGE === "all") reports.push(await runStoryTextEval(provider));
  if (STAGE === "storyboard" || STAGE === "all") reports.push(await runStoryboardEval(provider));

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join("evals", "reports");
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `${ts}.json`);
  await fs.writeFile(file, JSON.stringify({ generatedAt: ts, reports }, null, 2));
  console.log(`report written: ${file}`);
  for (const r of reports) {
    console.log(`${r.stage}: mean=${r.total.mean.toFixed(2)} n=${r.total.n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
