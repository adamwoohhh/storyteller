import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeTestDb } from "../helpers/db";
import { stories, characters } from "@/lib/db/schema";
import { generateCDSText } from "@/lib/pipeline/character-design-text";
import { FakeTextProvider } from "@/lib/providers/fake-text";
import { randomUUID } from "node:crypto";

describe("pipeline.cds-text", () => {
  it("fills CDS fields for each character", async () => {
    const { db } = await makeTestDb();
    const id = randomUUID();
    db.insert(stories)
      .values({ id, inputMode: "structured", storyText: "x", artStylePrompt: "watercolor" })
      .run();
    const a = randomUUID();
    const b = randomUUID();
    db.insert(characters).values({ id: a, storyId: id, name: "A", userInput: "勇敢" }).run();
    db.insert(characters).values({ id: b, storyId: id, name: "B", userInput: "聪明" }).run();
    await generateCDSText({ db, provider: new FakeTextProvider(), storyId: id });
    const rows = db.select().from(characters).where(eq(characters.storyId, id)).all();
    for (const r of rows) {
      expect(r.cdsAppearance.length).toBeGreaterThan(0);
      expect(r.cdsOutfit.length).toBeGreaterThan(0);
      expect(r.cdsTraits.length).toBeGreaterThan(0);
      expect(r.cdsStyle.length).toBeGreaterThan(0);
    }
  });
});
