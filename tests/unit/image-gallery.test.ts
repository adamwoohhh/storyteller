import { describe, expect, it } from "vitest";
import { buildStoryGalleryItems } from "@/app/s/[uuid]/_components/image-gallery";

describe("buildStoryGalleryItems", () => {
  it("collects story images in a stable playback order", () => {
    const data = {
      characters: [
        { id: "c2", name: "乌龟", userImageId: "upload-turtle", cdsImageId: null },
        { id: "c1", name: "小兔", userImageId: null, cdsImageId: "cds-rabbit" },
      ],
      nodes: [
        { id: "n2", orderIndex: 2, text: "第二幕", imageId: "scene-2" },
        { id: "n1", orderIndex: 1, text: "第一幕", imageId: "scene-1" },
      ],
    };

    expect(buildStoryGalleryItems(data)).toEqual([
      {
        id: "character-upload-c2",
        assetId: "upload-turtle",
        title: "乌龟",
        description: "上传参考图",
      },
      {
        id: "character-cds-c1",
        assetId: "cds-rabbit",
        title: "小兔",
        description: "角色设计图",
      },
      {
        id: "node-n1",
        assetId: "scene-1",
        title: "第 1 幕",
        description: "第一幕",
      },
      {
        id: "node-n2",
        assetId: "scene-2",
        title: "第 2 幕",
        description: "第二幕",
      },
    ]);
  });
});
