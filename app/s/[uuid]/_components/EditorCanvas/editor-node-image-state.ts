export type NodeImageStatus = "idle" | "generating" | "generated";

export type NodeImageLayout =
  | "stacked-image-top"
  | "stacked-image-bottom"
  | "inline-left"
  | "inline-right";

const STACKED_LAYOUT_TEXT_LIMIT = 52;
export const EDITOR_NODE_MIN_HEIGHT = 260;

const CARD_VERTICAL_CHROME = 96;
const TEXT_LINE_HEIGHT = 24;
const STACKED_IMAGE_HEIGHT = 128;
const IMAGE_GAP = 12;
const INLINE_FULL_WIDTH_CHARS_PER_LINE = 28;
const INLINE_WRAPPED_CHARS_PER_LINE = 16;
const INLINE_IMAGE_LINES = 6;
const STACKED_CHARS_PER_LINE = 30;
const IDLE_CHARS_PER_LINE = 32;

export function getNodeImageStatus(args: {
  imageId: string | null;
  isRendering: boolean;
}): NodeImageStatus {
  if (args.isRendering) return "generating";
  if (args.imageId) return "generated";
  return "idle";
}

export function getNodeImageLayout(args: { text: string; index: number }): NodeImageLayout {
  const normalizedLength = args.text.replace(/\s/g, "").length;
  const isEven = args.index % 2 === 0;

  if (normalizedLength <= STACKED_LAYOUT_TEXT_LIMIT) {
    return isEven ? "stacked-image-bottom" : "stacked-image-top";
  }

  return isEven ? "inline-right" : "inline-left";
}

export function getNodeCardHeight(args: {
  text: string;
  imageStatus: NodeImageStatus;
  imageLayout: NodeImageLayout;
}): number {
  const textLength = Math.max(1, args.text.replace(/\s/g, "").length);
  const hasVisual = args.imageStatus !== "idle";
  const isStacked =
    args.imageLayout === "stacked-image-top" || args.imageLayout === "stacked-image-bottom";

  let contentHeight: number;
  if (!hasVisual) {
    contentHeight = estimateLines(textLength, IDLE_CHARS_PER_LINE) * TEXT_LINE_HEIGHT;
  } else if (isStacked) {
    contentHeight =
      estimateLines(textLength, STACKED_CHARS_PER_LINE) * TEXT_LINE_HEIGHT +
      IMAGE_GAP +
      STACKED_IMAGE_HEIGHT;
  } else {
    const wrappedChars = INLINE_WRAPPED_CHARS_PER_LINE * INLINE_IMAGE_LINES;
    const remainingChars = Math.max(0, textLength - wrappedChars);
    const textLines =
      Math.min(INLINE_IMAGE_LINES, estimateLines(textLength, INLINE_WRAPPED_CHARS_PER_LINE)) +
      estimateLines(remainingChars, INLINE_FULL_WIDTH_CHARS_PER_LINE);
    contentHeight = Math.max(STACKED_IMAGE_HEIGHT, textLines * TEXT_LINE_HEIGHT);
  }

  return Math.max(EDITOR_NODE_MIN_HEIGHT, Math.ceil(contentHeight + CARD_VERTICAL_CHROME));
}

function estimateLines(textLength: number, charsPerLine: number): number {
  if (textLength <= 0) return 0;
  return Math.ceil(textLength / charsPerLine);
}
