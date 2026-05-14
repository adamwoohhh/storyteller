type RenderProgress = { current: number; total: number } | undefined;
type SceneRenderNode = { id: string; imageId?: string | null };

/**
 * 是否进入自动渲染，如果当前 story 状态是 cds_done，应该自动开始场景渲染
 * @param storyStatus 
 * @returns 
 */
export function shouldAutoStartSceneRender(storyStatus: string): boolean {
  return storyStatus === "cds_done";
}

export function isBulkSceneRendering({
  storyStatus,
  jobStatus,
  jobId,
}: {
  storyStatus: string;
  jobStatus?: string;
  jobId: string | null;
}): boolean {
  return storyStatus === "rendering" || (!!jobId && jobStatus === "running");
}

export function renderProgressLabel({
  progress,
  totalNodes,
}: {
  progress: RenderProgress;
  totalNodes: number;
}): string {
  const total = progress?.total ?? totalNodes;
  const current = progress?.current ?? 0;
  return `${current} / ${total}`;
}

export function countRetryableSceneRenderFailures({
  result,
  nodes,
}: {
  result: unknown;
  nodes: SceneRenderNode[];
}): number {
  if (typeof result !== "object" || result === null || !("errors" in result)) return 0;
  const errors = (result as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return 0;

  const missingImageNodeIds = new Set(
    nodes.filter((node) => !node.imageId).map((node) => node.id),
  );
  return errors.filter((error) => {
    if (typeof error !== "object" || error === null || !("nodeId" in error)) return false;
    const nodeId = (error as { nodeId?: unknown }).nodeId;
    return typeof nodeId === "string" && missingImageNodeIds.has(nodeId);
  }).length;
}
