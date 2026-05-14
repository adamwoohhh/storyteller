"use client";
import { useEffect, useState } from "react";
import {
  type JobSnapshot,
  type JobState,
  isTerminalJobState,
  jobSnapshotToState,
} from "./job-state";

export type { JobState } from "./job-state";

const SUBSCRIPTION_ERROR_MESSAGE = "任务状态订阅中断，正在自动轮询最新状态";

export function useJob(jobId: string | null): JobState {
  const [state, setState] = useState<JobState>({ status: "done", chunks: "" });

  useEffect(() => {
    if (!jobId) return;
    setState({ status: "running", chunks: "" });
    const es = new EventSource(`/api/sse/jobs/${jobId}`);
    let pollingTimer: number | null = null;
    let stopped = false;

    async function pollJob() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const snapshot = (await response.json()) as JobSnapshot;
        const nextState = jobSnapshotToState(snapshot);
        setState((current) => ({
          ...nextState,
          chunks: current.chunks,
          transportError: isTerminalJobState(nextState)
            ? undefined
            : SUBSCRIPTION_ERROR_MESSAGE,
        }));
        if (isTerminalJobState(nextState) && pollingTimer) {
          window.clearInterval(pollingTimer);
          pollingTimer = null;
        }
      } catch (error) {
        setState((current) => ({
          ...current,
          status: "running",
          transportError:
            error instanceof Error
              ? `${SUBSCRIPTION_ERROR_MESSAGE}：${error.message}`
              : SUBSCRIPTION_ERROR_MESSAGE,
        }));
      }
    }

    function startPolling() {
      if (pollingTimer || stopped) return;
      setState((current) => ({
        ...current,
        status: "running",
        transportError: SUBSCRIPTION_ERROR_MESSAGE,
      }));
      void pollJob();
      pollingTimer = window.setInterval(() => {
        void pollJob();
      }, 1500);
    }

    es.addEventListener("chunk", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as string;
      setState((s) => ({ ...s, chunks: s.chunks + data }));
    });
    es.addEventListener("progress", (e: MessageEvent) => {
      setState((s) => ({ ...s, progress: JSON.parse(e.data) }));
    });
    es.addEventListener("done", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as unknown;
      const result =
        typeof data === "object" && data !== null && "result" in data
          ? (data as { result: unknown }).result
          : data;
      setState((s) => ({ ...s, status: "done", result }));
      es.close();
    });
    es.addEventListener("partial_error", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as unknown;
      const payload =
        typeof data === "object" && data !== null && "result" in data
          ? (data as { error?: string; result: unknown })
          : { result: data };
      setState((s) => ({
        ...s,
        status: "partial_error",
        result: payload.result,
        error: payload.error ?? "部分节点渲染失败",
      }));
      es.close();
    });
    es.addEventListener("error", (e: MessageEvent) => {
      if (!("data" in e) || !e.data) {
        es.close();
        startPolling();
        return;
      }
      const data = e.data
        ? (JSON.parse(e.data) as { message?: string })
        : { message: "stream error" };
      setState((s) => ({ ...s, status: "error", error: data.message ?? "error" }));
      es.close();
    });
    return () => {
      stopped = true;
      es.close();
      if (pollingTimer) window.clearInterval(pollingTimer);
    };
  }, [jobId]);

  if (!jobId) return { status: "done", chunks: "" };
  return state;
}
