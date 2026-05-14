import { describe, expect, it } from "vitest";
import { makeTestDb } from "../helpers/db";
import { characters, jobs, nodes, stories } from "@/lib/db/schema";
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

  it("includes the latest partial scene render job in the active story bundle", async () => {
    const { db } = await makeTestDb();
    db.insert(stories).values({ id: "story-1", inputMode: "structured" }).run();
    db.insert(jobs)
      .values({
        id: "older-job",
        storyId: "story-1",
        kind: "scene_render",
        status: "partial_error",
        error: "older failure",
        result: JSON.stringify({ errors: [{ nodeId: "node-1", message: "older" }] }),
        updatedAt: 10,
      })
      .run();
    db.insert(jobs)
      .values({
        id: "latest-job",
        storyId: "story-1",
        kind: "scene_render",
        status: "partial_error",
        error: "latest failure",
        result: JSON.stringify({ errors: [{ nodeId: "node-2", message: "latest" }] }),
        updatedAt: 20,
      })
      .run();

    const bundle = getActiveStoryBundle(db, "story-1");

    expect(bundle?.sceneRenderFailureJob).toEqual({
      id: "latest-job",
      status: "partial_error",
      error: "latest failure",
      result: { errors: [{ nodeId: "node-2", message: "latest" }] },
    });
  });

  it("does not include an older partial scene render job after a newer successful batch render", async () => {
    const { db } = await makeTestDb();
    db.insert(stories).values({ id: "story-1", inputMode: "structured" }).run();
    db.insert(jobs)
      .values({
        id: "older-job",
        storyId: "story-1",
        kind: "scene_render",
        status: "partial_error",
        error: "older failure",
        result: JSON.stringify({ errors: [{ nodeId: "node-1", message: "older" }] }),
        updatedAt: 10,
      })
      .run();
    db.insert(jobs)
      .values({
        id: "latest-job",
        storyId: "story-1",
        kind: "scene_render",
        status: "done",
        result: JSON.stringify({ errors: [] }),
        updatedAt: 20,
      })
      .run();

    const bundle = getActiveStoryBundle(db, "story-1");

    expect(bundle?.sceneRenderFailureJob).toBeNull();
  });
});
