import { describe, expect, it } from "vitest";
import { makeTestDb } from "../helpers/db";
import { characters, nodes, stories } from "@/lib/db/schema";
import {
  getActiveStoryBundle,
  listActiveStories,
  logicallyDeleteStory,
} from "@/lib/stories/admin";

describe("story admin data model", () => {
  it("stores active stories with a null deletedAt value", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({ id: "story-active", inputMode: "structured", title: "Active" })
      .run();

    const row = db.select().from(stories).get();

    expect(row?.deletedAt).toBeNull();
  });
});

describe("story admin service", () => {
  it("lists only active stories with related counts, newest updated first", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({
        id: "older-active",
        inputMode: "structured",
        title: "Older",
        updatedAt: 10,
      })
      .run();
    db.insert(stories)
      .values({
        id: "newer-active",
        inputMode: "paste",
        title: "Newer",
        updatedAt: 20,
      })
      .run();
    db.insert(stories)
      .values({
        id: "deleted",
        inputMode: "paste",
        title: "Deleted",
        updatedAt: 30,
        deletedAt: 40,
      })
      .run();
    db.insert(characters).values({ id: "char-1", storyId: "newer-active", name: "Hero" }).run();
    db.insert(nodes).values({ id: "node-1", storyId: "newer-active", orderIndex: 0 }).run();

    const rows = listActiveStories(db);

    expect(rows.map((row) => row.id)).toEqual(["newer-active", "older-active"]);
    expect(rows[0]).toMatchObject({
      id: "newer-active",
      title: "Newer",
      characterCount: 1,
      nodeCount: 1,
    });
  });

  it("logically deletes a story while preserving related rows", async () => {
    const { db } = await makeTestDb();
    db.insert(stories).values({ id: "story-1", inputMode: "structured" }).run();
    db.insert(characters).values({ id: "char-1", storyId: "story-1", name: "Hero" }).run();
    db.insert(nodes).values({ id: "node-1", storyId: "story-1", orderIndex: 0 }).run();

    const result = logicallyDeleteStory(db, "story-1");

    const story = db.select().from(stories).get();
    expect(result).toEqual({ ok: true });
    expect(story?.deletedAt).toEqual(expect.any(Number));
    expect(db.select().from(characters).all()).toHaveLength(1);
    expect(db.select().from(nodes).all()).toHaveLength(1);
  });

  it("returns null for deleted stories in the active story bundle", async () => {
    const { db } = await makeTestDb();
    db.insert(stories)
      .values({ id: "deleted", inputMode: "structured", deletedAt: 10 })
      .run();

    expect(getActiveStoryBundle(db, "deleted")).toBeNull();
  });
});
