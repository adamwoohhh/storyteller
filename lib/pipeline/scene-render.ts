import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters, nodes, assets } from "@/lib/db/schema";
import type { ImageProvider } from "@/lib/providers/types";
import { saveAssetFile, readAssetFile } from "@/lib/storage/files";

export async function renderScene(args: {
  db: DB;
  provider: ImageProvider;
  storageRoot: string;
  nodeId: string;
  signal?: AbortSignal;
}): Promise<{ assetId: string; filePath: string; promptUsed: string }> {
  const { db, provider, storageRoot, nodeId, signal } = args;
  const node = db.select().from(nodes).where(eq(nodes.id, nodeId)).get();
  if (!node) throw new Error(`node not found: ${nodeId}`);
  const story = db.select().from(stories).where(eq(stories.id, node.storyId)).get();
  if (!story) throw new Error(`story not found: ${node.storyId}`);

  const cIds: string[] = JSON.parse(node.characters || "[]");
  const cRows = cIds.length
    ? db.select().from(characters).where(inArray(characters.id, cIds)).all()
    : [];
  const refBuffers: Buffer[] = [];
  for (const c of cRows) {
    if (c.cdsImageId) {
      const a = db.select().from(assets).where(eq(assets.id, c.cdsImageId)).get();
      if (a) refBuffers.push(await readAssetFile(storageRoot, a.filePath));
    }
  }

  const cdsBlock = cRows
    .map(
      (c) =>
        `${c.name}: ${[c.cdsAppearance, c.cdsOutfit, c.cdsTraits, c.cdsStyle]
          .filter(Boolean)
          .join(", ")}`,
    )
    .join(" | ");
  const promptUsed = [story.artStylePrompt, cdsBlock, node.imagePrompt].filter(Boolean).join("\n\n");

  const { bytes, mime } = await provider.generateImage({
    prompt: promptUsed,
    referenceImages: refBuffers.length ? refBuffers : undefined,
    signal,
  });

  const assetId = randomUUID();
  const filePath = await saveAssetFile({
    root: storageRoot,
    storyId: story.id,
    assetId,
    mime,
    bytes,
  });
  db.insert(assets)
    .values({ id: assetId, storyId: story.id, kind: "scene", filePath, mime })
    .run();
  db.update(nodes).set({ imageId: assetId }).where(eq(nodes.id, nodeId)).run();
  db.update(stories)
    .set({ updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, story.id))
    .run();
  return { assetId, filePath, promptUsed };
}
