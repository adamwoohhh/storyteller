import { describe, expect, it } from "vitest";
import { stories, characters, nodes, assets, jobs } from "@/lib/db/schema";

describe("db schema", () => {
  it("exports all tables", () => {
    expect(stories).toBeDefined();
    expect(characters).toBeDefined();
    expect(nodes).toBeDefined();
    expect(assets).toBeDefined();
    expect(jobs).toBeDefined();
  });
});
