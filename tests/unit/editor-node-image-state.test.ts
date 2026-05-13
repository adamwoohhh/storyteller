import { describe, expect, it } from "vitest";
import {
  getNodeCardHeight,
  getNodeImageLayout,
  getNodeImageStatus,
} from "@/app/s/[uuid]/_components/EditorCanvas/editor-node-image-state";

describe("editor node image state", () => {
  it("marks nodes with images as generated", () => {
    expect(getNodeImageStatus({ imageId: "asset-1", isRendering: false })).toBe("generated");
  });

  it("marks nodes as generating while a scene job targets them", () => {
    expect(getNodeImageStatus({ imageId: null, isRendering: true })).toBe("generating");
    expect(getNodeImageStatus({ imageId: "asset-1", isRendering: true })).toBe("generating");
  });

  it("marks nodes without images or jobs as idle", () => {
    expect(getNodeImageStatus({ imageId: null, isRendering: false })).toBe("idle");
  });

  it("uses stacked layouts for short text and alternates image placement", () => {
    expect(getNodeImageLayout({ text: "短短一句话。", index: 0 })).toBe("stacked-image-bottom");
    expect(getNodeImageLayout({ text: "短短一句话。", index: 1 })).toBe("stacked-image-top");
  });

  it("uses inline wrapping layouts for longer text and alternates image placement", () => {
    const longText =
      "月亮升起来时，小鹿听见森林深处传来很轻的铃声。它停下脚步，看见草叶上有一条发光的小路。小路绕过蘑菇和溪水，一直通向湖边。";

    expect(getNodeImageLayout({ text: longText, index: 0 })).toBe("inline-right");
    expect(getNodeImageLayout({ text: longText, index: 1 })).toBe("inline-left");
  });

  it("grows card height for long inline text so content can render without scrolling", () => {
    const longText =
      "日子一天天过去，老张每天都在山脚下忙碌。春天，他把挖出的泥土垒进坑里；走到山顶，心里就有了平静的感觉。夏天，他把碎石铺在门前，雨后再也不湿滑；秋天，他在新修的小路旁种下野菊和枣树；冬天，他把大石头砌成坡坎。";

    expect(
      getNodeCardHeight({
        text: longText,
        imageStatus: "generated",
        imageLayout: "inline-right",
      }),
    ).toBeGreaterThan(260);
  });

  it("keeps short cards at the default height", () => {
    expect(
      getNodeCardHeight({
        text: "小鹿沿着发光的小路走到湖边。",
        imageStatus: "idle",
        imageLayout: "stacked-image-bottom",
      }),
    ).toBe(260);
  });
});
