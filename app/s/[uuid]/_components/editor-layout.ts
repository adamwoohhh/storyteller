export interface EditorLayoutNode {
  orderIndex: number;
  positionX?: number | null;
  positionY?: number | null;
}

const GENERATED_VERTICAL_GAP = 220;
const GRID_COLUMNS = 3;
const GRID_X_GAP = 380;
const GRID_Y_GAP = 520;

function numberOrZero(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function hasGeneratedDefaultPosition(node: EditorLayoutNode, index: number): boolean {
  const x = numberOrZero(node.positionX);
  const y = numberOrZero(node.positionY);
  return x === 0 && (y === 0 || y === index * GENERATED_VERTICAL_GAP);
}

export function getEditorNodePosition(
  node: EditorLayoutNode,
  index: number,
  nodes: EditorLayoutNode[],
): { x: number; y: number } {
  if (nodes.length <= 1 || !hasGeneratedDefaultPosition(node, index)) {
    return {
      x: numberOrZero(node.positionX),
      y: numberOrZero(node.positionY),
    };
  }

  return {
    x: (index % GRID_COLUMNS) * GRID_X_GAP,
    y: Math.floor(index / GRID_COLUMNS) * GRID_Y_GAP,
  };
}

export function getOrganizedNodePositions({
  count,
  canvasWidth,
  nodeWidth,
  nodeHeight,
  nodeHeights,
  gapX,
  gapY,
}: {
  count: number;
  canvasWidth: number;
  nodeWidth: number;
  nodeHeight: number;
  nodeHeights?: number[];
  gapX: number;
  gapY: number;
}): { x: number; y: number }[] {
  const columns = Math.max(1, Math.floor((canvasWidth + gapX) / (nodeWidth + gapX)));
  const positions: { x: number; y: number }[] = [];
  let y = 0;

  for (let rowStart = 0; rowStart < count; rowStart += columns) {
    const rowEnd = Math.min(rowStart + columns, count);
    const rowHeights = Array.from({ length: rowEnd - rowStart }, (_, offset) => {
      const height = nodeHeights?.[rowStart + offset];
      return Number.isFinite(height) && height ? height : nodeHeight;
    });
    const rowHeight = Math.max(...rowHeights, nodeHeight);

    for (let index = rowStart; index < rowEnd; index++) {
      positions.push({
        x: (index - rowStart) * (nodeWidth + gapX),
        y,
      });
    }

    y += rowHeight + gapY;
  }

  return positions;
}
