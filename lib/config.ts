import { z } from "zod";

const Schema = z.object({
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_TEXT_MODEL: z.string().optional().default("gpt-5"),
  OPENAI_IMAGE_MODEL: z.string().optional().default("gpt-image-1"),
  MODELHUB_API_KEY: z.string().optional().default(""),
  MODELHUB_TEXT_MODEL: z.string().optional().default("gpt-5.5-2026-04-24"),
  MODELHUB_IMAGE_MODEL: z.string().optional().default("gpt-image-2"),
  MODELHUB_TEXT_BASE_URL: z
    .string()
    .optional()
    .default("https://aidp.bytedance.net/api/modelhub/online/v2/crawl"),
  MODELHUB_IMAGE_BASE_URL: z
    .string()
    .optional()
    .default("https://aidp.bytedance.net/api/modelhub/online/v2/crawl/openai"),
  MODELHUB_IMAGE_EDIT_BASE_URL: z
    .string()
    .optional()
    .default("https://aidp.bytedance.net/gpt/openapi/online/v2/crawl/openai"),
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(3),
  PROVIDER_MODE: z.enum(["openai", "modelhub", "fake"]).default("openai"),
  DATABASE_URL: z.string().min(1),
  STORAGE_DIR: z.string().min(1),
});

export type Config = {
  providerMode: "openai" | "modelhub" | "fake";
  jobConcurrency: number;
  openai: { apiKey: string; textModel: string; imageModel: string };
  modelhub: {
    apiKey: string;
    textModel: string;
    imageModel: string;
    textBaseURL: string;
    imageBaseURL: string;
    imageEditBaseURL: string;
  };
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
  if (parsed.PROVIDER_MODE === "modelhub" && !parsed.MODELHUB_API_KEY) {
    throw new Error("MODELHUB_API_KEY is required when PROVIDER_MODE=modelhub");
  }
  return {
    providerMode: parsed.PROVIDER_MODE,
    jobConcurrency: parsed.JOB_CONCURRENCY,
    openai: {
      apiKey: parsed.OPENAI_API_KEY,
      textModel: parsed.OPENAI_TEXT_MODEL,
      imageModel: parsed.OPENAI_IMAGE_MODEL,
    },
    modelhub: {
      apiKey: parsed.MODELHUB_API_KEY,
      textModel: parsed.MODELHUB_TEXT_MODEL,
      imageModel: parsed.MODELHUB_IMAGE_MODEL,
      textBaseURL: parsed.MODELHUB_TEXT_BASE_URL,
      imageBaseURL: parsed.MODELHUB_IMAGE_BASE_URL,
      imageEditBaseURL: parsed.MODELHUB_IMAGE_EDIT_BASE_URL,
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
