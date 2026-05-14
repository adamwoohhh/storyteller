export interface JobState {
  status: "running" | "done" | "partial_error" | "error";
  chunks: string;
  progress?: { current: number; total: number; note?: string; nodeId?: string };
  result?: unknown;
  error?: string;
  transportError?: string;
}

export interface JobSnapshot {
  status: "pending" | "running" | "done" | "partial_error" | "error" | "canceled";
  result?: unknown;
  error?: string | null;
}

export function jobSnapshotToState(snapshot: JobSnapshot): JobState {
  if (snapshot.status === "pending" || snapshot.status === "running") {
    return { status: "running", chunks: "" };
  }
  if (snapshot.status === "done") {
    return { status: "done", chunks: "", result: snapshot.result };
  }
  if (snapshot.status === "partial_error") {
    return {
      status: "partial_error",
      chunks: "",
      result: snapshot.result,
      error: snapshot.error ?? "部分节点渲染失败",
    };
  }
  return {
    status: "error",
    chunks: "",
    error: snapshot.error ?? (snapshot.status === "canceled" ? "任务已取消" : "error"),
  };
}

export function isTerminalJobState(state: JobState): boolean {
  return state.status === "done" || state.status === "partial_error" || state.status === "error";
}
