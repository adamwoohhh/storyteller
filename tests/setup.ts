import { beforeAll } from "vitest";

beforeAll(() => {
  process.env.PROVIDER_MODE = "fake";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.JOB_CONCURRENCY = "2";
});
