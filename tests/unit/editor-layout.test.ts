import { describe, expect, it } from "vitest";
import {
  getEditorNodePosition,
  getOrganizedNodePositions,
} from "@/app/s/[uuid]/_components/editor-layout";

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
      { x: 440, y: 0 },
      { x: 880, y: 0 },
      { x: 0, y: 348 },
      { x: 440, y: 348 },
    ]);
  });

  it("keeps generated default grid columns wider than the current card width", () => {
    const nodes = [
      { id: "a", orderIndex: 0, positionX: 0, positionY: 0 },
      { id: "b", orderIndex: 1, positionX: 0, positionY: 220 },
    ];

    const positions = nodes.map((node, index) => getEditorNodePosition(node, index, nodes));

    expect(positions[1]!.x - positions[0]!.x).toBeGreaterThanOrEqual(440);
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
      { x: 440, y: 0 },
      { x: 880, y: 0 },
    ]);
  });

  it("reflows persisted legacy generated grid positions that are too dense for current cards", () => {
    const nodes = [
      { id: "a", orderIndex: 0, positionX: 0, positionY: 0 },
      { id: "b", orderIndex: 1, positionX: 344, positionY: 0 },
      { id: "c", orderIndex: 2, positionX: 688, positionY: 0 },
      { id: "d", orderIndex: 3, positionX: 0, positionY: 524 },
    ];

    expect(nodes.map((node, index) => getEditorNodePosition(node, index, nodes))).toEqual([
      { x: 0, y: 0 },
      { x: 440, y: 0 },
      { x: 880, y: 0 },
      { x: 0, y: 348 },
    ]);
  });
});

describe("getOrganizedNodePositions", () => {
  it("lays nodes out horizontally and wraps based on canvas width and node width", () => {
    expect(
      getOrganizedNodePositions({
        count: 5,
        canvasWidth: 900,
        nodeWidth: 288,
        nodeHeight: 430,
        gapX: 56,
        gapY: 88,
      }),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 344, y: 0 },
      { x: 0, y: 518 },
      { x: 344, y: 518 },
      { x: 0, y: 1036 },
    ]);
  });

  it("keeps at least one node per row on narrow canvases", () => {
    expect(
      getOrganizedNodePositions({
        count: 3,
        canvasWidth: 240,
        nodeWidth: 288,
        nodeHeight: 430,
        gapX: 56,
        gapY: 88,
      }),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 518 },
      { x: 0, y: 1036 },
    ]);
  });

  it("uses the tallest node in each row when calculating the next row", () => {
    expect(
      getOrganizedNodePositions({
        count: 5,
        canvasWidth: 900,
        nodeWidth: 288,
        nodeHeight: 430,
        nodeHeights: [430, 600, 300, 500, 200],
        gapX: 56,
        gapY: 88,
      }),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 344, y: 0 },
      { x: 0, y: 688 },
      { x: 344, y: 688 },
      { x: 0, y: 1276 },
    ]);
  });
});
