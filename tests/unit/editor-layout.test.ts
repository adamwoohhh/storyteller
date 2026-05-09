import { describe, expect, it } from "vitest";
import { getEditorNodePosition } from "@/app/s/[uuid]/_components/editor-layout";

describe("getEditorNodePosition", () => {
  it("spreads generated default vertical positions into a draggable grid", () => {
    const nodes = Array.from({ length: 5 }, (_, i) => ({
      id: `node-${i}`,
      orderIndex: i,
      positionX: 0,
      positionY: i * 220,
    }));

    expect(nodes.map((node, index) => getEditorNodePosition(node, index, nodes))).toEqual([
      { x: 0, y: 0 },
      { x: 380, y: 0 },
      { x: 760, y: 0 },
      { x: 0, y: 520 },
      { x: 380, y: 520 },
    ]);
  });

  it("keeps custom positions after the user has moved nodes", () => {
    const nodes = [
      { id: "a", orderIndex: 0, positionX: 120, positionY: 80 },
      { id: "b", orderIndex: 1, positionX: 520, positionY: 160 },
    ];

    expect(nodes.map((node, index) => getEditorNodePosition(node, index, nodes))).toEqual([
      { x: 120, y: 80 },
      { x: 520, y: 160 },
    ]);
  });

  it("keeps moved nodes while spreading nodes that still have generated defaults", () => {
    const nodes = [
      { id: "a", orderIndex: 0, positionX: 120, positionY: 80 },
      { id: "b", orderIndex: 1, positionX: 0, positionY: 220 },
      { id: "c", orderIndex: 2, positionX: 0, positionY: 440 },
    ];

    expect(nodes.map((node, index) => getEditorNodePosition(node, index, nodes))).toEqual([
      { x: 120, y: 80 },
      { x: 380, y: 0 },
      { x: 760, y: 0 },
    ]);
  });
});
