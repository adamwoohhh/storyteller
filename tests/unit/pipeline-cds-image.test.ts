import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, assets } from "@/lib/db/schema";
import { renderCDSImage } from "@/lib/pipeline/character-design-image";
import { FakeImageProvider } from "@/lib/providers/fake-image";
import { randomUUID } from "node:crypto";

describe("pipeline.cds-image", () => {
  it("creates an asset and links it to the character", async () => {
    const { db } = await makeTestDb();
    const root = mkdtempSync(path.join(tmpdir(), "cdsi-"));
    try {
      const sId = randomUUID();
      db.insert(stories)
        .values({ id: sId, inputMode: "structured", artStylePrompt: "watercolor" })
        .run();
      const cId = randomUUID();
      db.insert(characters)
        .values({
          id: cId,
          storyId: sId,
          name: "X",
          cdsAppearance: "tall",
          cdsOutfit: "blue coat",
          cdsTraits: "kind",
          cdsStyle: "soft",
        })
        .run();
      const result = await renderCDSImage({
        db,
        provider: new FakeImageProvider(),
        storageRoot: root,
        characterId: cId,
      });
      expect(result.assetId).toBeDefined();
      const row = db.select().from(characters).where(eq(characters.id, cId)).get();
      expect(row?.cdsImageId).toBe(result.assetId);
      const a = db.select().from(assets).where(eq(assets.id, result.assetId)).get();
      expect(a?.kind).toBe("cds");
      expect(existsSync(path.join(root, a!.filePath))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
