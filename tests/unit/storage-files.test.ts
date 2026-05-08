import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { saveAssetFile, deleteAssetFile, resolveAssetPath } from "@/lib/storage/files";

describe("storage/files", () => {
  it("writes asset to {root}/{storyId}/{assetId}.{ext}", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "stor-"));
    try {
      const rel = await saveAssetFile({
        root,
        storyId: "s1",
        assetId: "a1",
        mime: "image/png",
        bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      });
      expect(rel).toMatch(/s1\/a1\.png$/);
      expect(readFileSync(resolveAssetPath(root, rel))).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("deletes asset", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "stor-"));
    try {
      const rel = await saveAssetFile({
        root,
        storyId: "s",
        assetId: "a",
        mime: "image/png",
        bytes: Buffer.from([1]),
      });
      await deleteAssetFile(root, rel);
      expect(existsSync(resolveAssetPath(root, rel))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
