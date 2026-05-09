import type { Config } from "../config";
import type { TextProvider, ImageProvider } from "./types";
import { FakeTextProvider } from "./fake-text";
import { FakeImageProvider } from "./fake-image";
import { OpenAITextProvider } from "./openai-text";
import { OpenAIImageProvider } from "./openai-image";
import { ModelHubTextProvider } from "./modlehub-text";
import { ModelHubImageProvider } from "./modelhub-image";

export function getTextProvider(cfg: Config): TextProvider {
  if (cfg.providerMode === "fake") return new FakeTextProvider();
  if (cfg.providerMode === "modelhub") {
    return new ModelHubTextProvider({
      apiKey: cfg.modelhub.apiKey,
      model: cfg.modelhub.textModel,
      baseURL: cfg.modelhub.textBaseURL,
    });
  }
  return new OpenAITextProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.textModel });
}

export function getImageProvider(cfg: Config): ImageProvider {
  if (cfg.providerMode === "fake") return new FakeImageProvider();
  if (cfg.providerMode === "modelhub") {
    return new ModelHubImageProvider({
      apiKey: cfg.modelhub.apiKey,
      model: cfg.modelhub.imageModel,
      baseURL: cfg.modelhub.imageBaseURL,
      editBaseURL: cfg.modelhub.imageEditBaseURL,
    });
  }
  return new OpenAIImageProvider({ apiKey: cfg.openai.apiKey, model: cfg.openai.imageModel });
}
