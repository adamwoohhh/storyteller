"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client/api";
import { StepStoryText } from "./StepStoryText";
import { StepStoryboard } from "./StepStoryboard";
import { StepArtStyle } from "./StepArtStyle";
import { StepCDS } from "./StepCDS";
import { EditorCanvas } from "./EditorCanvas";
import { ReadView } from "./ReadView";
import { StepNavigationProvider } from "./StepFrame";
import {
  getAccessibleWorkflowSteps,
  getCurrentWorkflowStep,
  isWorkflowStep,
  type WorkflowStep,
} from "@/lib/workflow-steps";
import { getStoryStepRedirectHref } from "@/lib/story-step-redirect";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;

/**
 * 创作流程分步调度
 */
export function StepShell({
  storyId,
  step,
  mode,
}: {
  storyId: string;
  step: string;
  mode: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 查询故事信息
  const reload = useCallback(
    async () =>
      api.getStory(storyId).then((nextData) => {
        setData(nextData);
        setLoadError(null);
      }),
    [storyId],
  );

  useEffect(() => {
    reload().catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : String(error));
    });
  }, [reload]);

  const status = data?.story.status as string | undefined;
  const characterCount = (data?.characters.length ?? 0) as number;
  const workflowState = data
    ? {
        status: status ?? "",
        inputMode: data.story.inputMode,
        characterCount,
      }
    : null;
  const currentWorkflowStep = workflowState ? getCurrentWorkflowStep(workflowState) : null;
  const accessibleSteps = workflowState ? getAccessibleWorkflowSteps(workflowState) : [];
  const usesModeNavigation = Boolean(sp.get("mode") && !sp.get("step"));
  const pendingRedirectHref = data
    ? getStoryStepRedirectHref({
        storyId,
        step,
        currentWorkflowStep,
        accessibleSteps,
        usesModeNavigation,
      })
    : null;

  useEffect(() => {
    if (pendingRedirectHref) router.replace(pendingRedirectHref);
  }, [pendingRedirectHref, router]);

  const goto = (s: WorkflowStep) => router.push(`/s/${storyId}?step=${s}`);
  const gotoMode = (m: "edit" | "read") => router.push(`/s/${storyId}?mode=${m}`);

  if (!data) {
    return (
      <main className="story-bg flex min-h-screen items-center justify-center px-4">
        <div className="story-panel px-8 py-6 text-center font-black text-primary">
          {loadError ? `加载失败：${loadError}` : "加载故事小剧场中…"}
        </div>
      </main>
    );
  }

  // 如果不存在 step 参数且存在mode参数，则进入阅读/编辑切换模式
  if (usesModeNavigation) {
    return mode === "read" ? (
      <ReadView data={data} onSwitch={() => gotoMode("edit")} />
    ) : (
      <EditorCanvas data={data} onSwitch={() => gotoMode("read")} reload={reload} />
    );
  }

  if (pendingRedirectHref) {
    return (
      <main className="story-bg flex min-h-screen items-center justify-center px-4">
        <div className="story-panel px-8 py-6 text-center font-black text-primary">
          {isWorkflowStep(step) ? "正在打开可执行的步骤…" : "正在打开下一幕…"}
        </div>
      </main>
    );
  }

  const wrapStep = (children: React.ReactNode) => (
    <StepNavigationProvider value={{ accessibleSteps, onStepSelect: goto }}>
      {children}
    </StepNavigationProvider>
  );

  // 进入故事创作流程
  switch (step) {
    case "story":
      return wrapStep(
        <StepStoryText data={data} onNext={() => goto("storyboard")} reload={reload} />
      );
    case "storyboard":
      return wrapStep(
        <StepStoryboard data={data} onNext={() => goto("style")} reload={reload} />
      );
    case "style":
      return wrapStep(<StepArtStyle data={data} onNext={() => goto("cds")} reload={reload} />);
    case "cds":
      return wrapStep(<StepCDS data={data} onNext={() => gotoMode("edit")} reload={reload} />);
    default:
      return (
        <main className="story-bg flex min-h-screen items-center justify-center px-4">
          <div className="story-panel px-8 py-6 text-center font-black text-primary">
            正在打开下一幕…
          </div>
        </main>
      );
  }
}
