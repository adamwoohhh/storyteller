"use client";
import { useEffect, useState } from "react";

export interface JobState {
  status: "running" | "done" | "error";
  chunks: string;
  progress?: { current: number; total: number; note?: string; nodeId?: string };
  result?: unknown;
  error?: string;
}

export function useJob(jobId: string | null): JobState {
  const [state, setState] = useState<JobState>({ status: "done", chunks: "" });

  useEffect(() => {
    if (!jobId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "running", chunks: "" });
    const es = new EventSource(`/api/sse/jobs/${jobId}`);
    es.addEventListener("chunk", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as string;
      setState((s) => ({ ...s, chunks: s.chunks + data }));
    });
    es.addEventListener("progress", (e: MessageEvent) => {
      setState((s) => ({ ...s, progress: JSON.parse(e.data) }));
    });
    es.addEventListener("done", (e: MessageEvent) => {
      setState((s) => ({ ...s, status: "done", result: JSON.parse(e.data) }));
      es.close();
    });
    es.addEventListener("error", (e: MessageEvent) => {
      const data = e.data
        ? (JSON.parse(e.data) as { message?: string })
        : { message: "stream error" };
      setState((s) => ({ ...s, status: "error", error: data.message ?? "error" }));
      es.close();
    });
    return () => es.close();
  }, [jobId]);

  if (!jobId) return { status: "done", chunks: "" };
  return state;
}
