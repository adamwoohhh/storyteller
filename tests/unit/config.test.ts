import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config";

describe("config", () => {
  it("parses required env vars", () => {
    const cfg = loadConfig({
      OPENAI_API_KEY: "sk-xxx",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      JOB_CONCURRENCY: "3",
      PROVIDER_MODE: "openai",
      DATABASE_URL: "file:./data/storyteller.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.providerMode).toBe("openai");
    expect(cfg.jobConcurrency).toBe(3);
    expect(cfg.openai.apiKey).toBe("sk-xxx");
  });

  it("defaults concurrency and provider mode", () => {
    const cfg = loadConfig({
      OPENAI_API_KEY: "sk-x",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.providerMode).toBe("openai");
    expect(cfg.jobConcurrency).toBe(3);
  });

  it("rejects missing api key when mode is openai", () => {
    expect(() =>
      loadConfig({
        PROVIDER_MODE: "openai",
        OPENAI_TEXT_MODEL: "gpt-5",
        OPENAI_IMAGE_MODEL: "gpt-image-1",
        DATABASE_URL: "file:./data/x.db",
        STORAGE_DIR: "./data/images",
      }),
    ).toThrow(/OPENAI_API_KEY/);
  });

  it("allows missing api key when fake", () => {
    const cfg = loadConfig({
      PROVIDER_MODE: "fake",
      OPENAI_TEXT_MODEL: "gpt-5",
      OPENAI_IMAGE_MODEL: "gpt-image-1",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    });
    expect(cfg.openai.apiKey).toBe("");
  });

  it("parses modelhub env vars", () => {
    const cfg = loadConfig({
      PROVIDER_MODE: "modelhub",
      MODELHUB_API_KEY: "mh-key",
      MODELHUB_TEXT_MODEL: "gpt-5.5-2026-04-24",
      MODELHUB_IMAGE_MODEL: "gpt-image-2",
      DATABASE_URL: "file:./data/x.db",
      STORAGE_DIR: "./data/images",
    });

    expect(cfg.providerMode).toBe("modelhub");
    expect(cfg.modelhub.apiKey).toBe("mh-key");
    expect(cfg.modelhub.textModel).toBe("gpt-5.5-2026-04-24");
    expect(cfg.modelhub.imageModel).toBe("gpt-image-2");
  });

  it("rejects missing api key when mode is modelhub", () => {
    expect(() =>
      loadConfig({
        PROVIDER_MODE: "modelhub",
        MODELHUB_TEXT_MODEL: "gpt-5.5-2026-04-24",
        MODELHUB_IMAGE_MODEL: "gpt-image-2",
        DATABASE_URL: "file:./data/x.db",
        STORAGE_DIR: "./data/images",
      }),
    ).toThrow(/MODELHUB_API_KEY/);
  });
});
