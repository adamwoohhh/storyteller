import { z } from "zod";

const Schema = z.object({
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_TEXT_MODEL: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1),
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(3),
  PROVIDER_MODE: z.enum(["openai", "fake"]).default("openai"),
  DATABASE_URL: z.string().min(1),
  STORAGE_DIR: z.string().min(1),
});

export type Config = {
  providerMode: "openai" | "fake";
  jobConcurrency: number;
  openai: { apiKey: string; textModel: string; imageModel: string };
  databaseUrl: string;
  storageDir: string;
};

export function loadConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Config {
  const parsed = Schema.parse(env);
  if (parsed.PROVIDER_MODE === "openai" && !parsed.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when PROVIDER_MODE=openai");
  }
  return {
    providerMode: parsed.PROVIDER_MODE,
    jobConcurrency: parsed.JOB_CONCURRENCY,
    openai: {
      apiKey: parsed.OPENAI_API_KEY,
      textModel: parsed.OPENAI_TEXT_MODEL,
      imageModel: parsed.OPENAI_IMAGE_MODEL,
    },
    databaseUrl: parsed.DATABASE_URL,
    storageDir: parsed.STORAGE_DIR,
  };
}

let cached: Config | null = null;
export function getConfig(): Config {
  if (!cached) cached = loadConfig();
  return cached;
}
