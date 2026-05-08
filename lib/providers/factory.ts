import type { Config } from "../config";
import type { TextProvider, ImageProvider } from "./types";
import { FakeTextProvider } from "./fake-text";
import { FakeImageProvider } from "./fake-image";
import { OpenAITextProvider } from "./openai-text";
import { OpenAIImageProvider } from "./openai-image";

export function getTextProvider(cfg: Config): TextProvider {
  if (cfg.providerMode === "fake") return new FakeTextProvider();
  return new OpenAITextProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.textModel });
}

export function getImageProvider(cfg: Config): ImageProvider {
  if (cfg.providerMode === "fake") return new FakeImageProvider();
  return new OpenAIImageProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.imageModel });
}
