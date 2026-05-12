export interface EditorLayoutNode {
  orderIndex: number;
  positionX?: number | null;
  positionY?: number | null;
}

const GENERATED_VERTICAL_GAP = 220;
export const EDITOR_NODE_WIDTH = 384;
export const EDITOR_NODE_HEIGHT = 260;
export const EDITOR_NODE_GAP_X = 56;
export const EDITOR_NODE_GAP_Y = 88;
const GRID_COLUMNS = 3;
const LEGACY_GRID_X_STEP = 344;

function numberOrZero(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function hasGeneratedDefaultPosition(node: EditorLayoutNode, index: number): boolean {
  const x = numberOrZero(node.positionX);
  const y = numberOrZero(node.positionY);
  return x === 0 && (y === 0 || y === index * GENERATED_VERTICAL_GAP);
}

function hasLegacyDenseGridPosition(
  node: EditorLayoutNode,
  index: number,
  nodes: EditorLayoutNode[],
): boolean {
  const x = numberOrZero(node.positionX);
  const expectedLegacyX = (index % GRID_COLUMNS) * LEGACY_GRID_X_STEP;
  if (x !== expectedLegacyX) return false;

  const rowStart = Math.floor(index / GRID_COLUMNS) * GRID_COLUMNS;
  const rowY = numberOrZero(nodes[rowStart]?.positionY);
  return numberOrZero(node.positionY) === rowY;
}

export function getEditorNodePosition(
  node: EditorLayoutNode,
  index: number,
  nodes: EditorLayoutNode[],
): { x: number; y: number } {
  const shouldReflow =
    hasGeneratedDefaultPosition(node, index) ||
    hasLegacyDenseGridPosition(node, index, nodes);

  if (nodes.length <= 1 || !shouldReflow) {
    return {
      x: numberOrZero(node.positionX),
      y: numberOrZero(node.positionY),
    };
  }

  return {
    x: (index % GRID_COLUMNS) * (EDITOR_NODE_WIDTH + EDITOR_NODE_GAP_X),
    y: Math.floor(index / GRID_COLUMNS) * (EDITOR_NODE_HEIGHT + EDITOR_NODE_GAP_Y),
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
