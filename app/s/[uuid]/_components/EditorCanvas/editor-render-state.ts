type RenderProgress = { current: number; total: number } | undefined;

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
