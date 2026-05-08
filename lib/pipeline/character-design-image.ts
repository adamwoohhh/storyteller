import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/client";
import { stories, characters, assets } from "@/lib/db/schema";
import type { ImageProvider } from "@/lib/providers/types";
import { saveAssetFile, readAssetFile } from "@/lib/storage/files";

export async function renderCDSImage(args: {
  db: DB;
  provider: ImageProvider;
  storageRoot: string;
  characterId: string;
  signal?: AbortSignal;
}): Promise<{ assetId: string; filePath: string }> {
  const { db, provider, storageRoot, characterId, signal } = args;
  const c = db.select().from(characters).where(eq(characters.id, characterId)).get();
  if (!c) throw new Error(`character not found: ${characterId}`);
  const story = db.select().from(stories).where(eq(stories.id, c.storyId)).get();
  if (!story) throw new Error(`story not found: ${c.storyId}`);

  const refImages: Buffer[] = [];
  if (c.userImageId) {
    const ua = db.select().from(assets).where(eq(assets.id, c.userImageId)).get();
    if (ua) refImages.push(await readAssetFile(storageRoot, ua.filePath));
  }

  const cdsBlock = [c.cdsAppearance, c.cdsOutfit, c.cdsTraits, c.cdsStyle]
    .filter(Boolean)
    .join(", ");
  const prompt = `${story.artStylePrompt}. Character reference sheet for ${c.name}: ${cdsBlock}. Single full-body character on neutral background, no text.`;

  const { bytes, mime } = await provider.generateImage({
    prompt,
    referenceImages: refImages.length ? refImages : undefined,
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
    .values({ id: assetId, storyId: story.id, kind: "cds", filePath, mime })
    .run();
  db.update(characters).set({ cdsImageId: assetId }).where(eq(characters.id, characterId)).run();
  db.update(stories)
    .set({ updatedAt: sql`(unixepoch())` })
    .where(eq(stories.id, story.id))
    .run();
  return { assetId, filePath };
}
