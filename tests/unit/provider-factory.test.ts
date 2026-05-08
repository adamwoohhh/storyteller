import { describe, expect, it } from "vitest";
import type { Config } from "@/lib/config";
import { getTextProvider, getImageProvider } from "@/lib/providers/factory";

const cfgFake: Config = {
  providerMode: "fake",
  jobConcurrency: 1,
  openai: { apiKey: "", textModel: "x", imageModel: "y" },
  databaseUrl: "file:./x.db",
  storageDir: "./x",
};

const cfgOpenai: Config = {
  ...cfgFake,
  providerMode: "openai",
  openai: { apiKey: "k", textModel: "gpt-5", imageModel: "gpt-image-1" },
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
});
