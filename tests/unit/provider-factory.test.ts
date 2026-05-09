import { describe, expect, it } from "vitest";
import type { Config } from "@/lib/config";
import { getTextProvider, getImageProvider } from "@/lib/providers/factory";

const cfgFake: Config = {
  providerMode: "fake",
  jobConcurrency: 1,
  openai: { apiKey: "", textModel: "x", imageModel: "y" },
  modelhub: {
    apiKey: "",
    textModel: "x",
    imageModel: "y",
    textBaseURL: "https://aidp.bytedance.net/api/modelhub/online/v2/crawl",
    imageBaseURL: "https://aidp.bytedance.net/api/modelhub/online/v2/crawl/openai",
    imageEditBaseURL: "https://aidp.bytedance.net/gpt/openapi/online/v2/crawl/openai",
  },
  databaseUrl: "file:./x.db",
  storageDir: "./x",
};

const cfgOpenai: Config = {
  ...cfgFake,
  providerMode: "openai",
  openai: { apiKey: "k", textModel: "gpt-5", imageModel: "gpt-image-1" },
};

const cfgModelhub: Config = {
  ...cfgFake,
  providerMode: "modelhub",
  modelhub: {
    ...cfgFake.modelhub,
    apiKey: "mh-key",
    textModel: "gpt-5.5-2026-04-24",
    imageModel: "gpt-image-2",
  },
};

describe("provider factory", () => {
  it("returns fake providers when PROVIDER_MODE=fake", () => {
    expect(getTextProvider(cfgFake).constructor.name).toBe("FakeTextProvider");
    expect(getImageProvider(cfgFake).constructor.name).toBe("FakeImageProvider");
  });

  it("returns openai providers when PROVIDER_MODE=openai", () => {
    expect(getTextProvider(cfgOpenai).constructor.name).toBe("OpenAITextProvider");
    expect(getImageProvider(cfgOpenai).constructor.name).toBe("OpenAIImageProvider");
  });

  it("returns modelhub providers when PROVIDER_MODE=modelhub", () => {
    expect(getTextProvider(cfgModelhub).constructor.name).toBe("ModelHubTextProvider");
    expect(getImageProvider(cfgModelhub).constructor.name).toBe("ModelHubImageProvider");
  });
});
