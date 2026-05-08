import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters, nodes, assets } from "@/lib/db/schema";
import { renderScene } from "@/lib/pipeline/scene-render";
import { FakeImageProvider } from "@/lib/providers/fake-image";
import { randomUUID } from "node:crypto";

describe("pipeline.scene-render", () => {
  it("links new asset to node and concatenates style + cds + image_prompt", async () => {
    const { db } = await makeTestDb();
    const root = mkdtempSync(path.join(tmpdir(), "scn-"));
    try {
      const sId = randomUUID();
      db.insert(stories)
        .values({ id: sId, inputMode: "structured", artStylePrompt: "watercolor" })
        .run();
      const cdsAssetId = randomUUID();
      db.insert(assets)
        .values({
          id: cdsAssetId,
          storyId: sId,
          kind: "cds",
          filePath: "x/y.png",
          mime: "image/png",
        })
        .run();
      const fs = await import("node:fs/promises");
      await fs.mkdir(path.join(root, "x"), { recursive: true });
      await fs.writeFile(path.join(root, "x/y.png"), Buffer.from([1]));
      const cId = randomUUID();
      db.insert(characters)
        .values({
          id: cId,
          storyId: sId,
          name: "X",
          cdsAppearance: "tall",
          cdsOutfit: "blue",
          cdsTraits: "kind",
          cdsStyle: "warm",
          cdsImageId: cdsAssetId,
        })
        .run();
      const nId = randomUUID();
      db.insert(nodes)
        .values({
          id: nId,
          storyId: sId,
          orderIndex: 0,
          text: "他走进森林。",
          imagePrompt: "X walks into a forest at dusk",
          characters: JSON.stringify([cId]),
        })
        .run();
      const r = await renderScene({
        db,
        provider: new FakeImageProvider(),
        storageRoot: root,
        nodeId: nId,
      });
      expect(r.assetId).toBeDefined();
      const row = db.select().from(nodes).where(eq(nodes.id, nId)).get();
      expect(row?.imageId).toBe(r.assetId);
      expect(r.promptUsed).toContain("watercolor");
      expect(r.promptUsed).toContain("X walks into a forest at dusk");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
