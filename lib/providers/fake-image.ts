import type { ImageProvider, ImageGenOpts } from "./types";

const ONE_PIXEL_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489000000" +
    "0a49444154789c63000100000005000196712b210000000049454e44ae426082",
  "hex",
);

export class FakeImageProvider implements ImageProvider {
  async generateImage(_opts: ImageGenOpts): Promise<{ bytes: Buffer; mime: string }> {
    return { bytes: ONE_PIXEL_PNG, mime: "image/png" };
  }
}
