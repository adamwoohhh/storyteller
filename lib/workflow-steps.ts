export const WORKFLOW_STEPS = [
  { id: "story", label: "故事" },
  { id: "extract", label: "角色" },
  { id: "storyboard", label: "分镜" },
  { id: "style", label: "画风" },
  { id: "cds", label: "角色图" },
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number]["id"];

export type StoryStatus =
  | "draft"
  | "text_done"
  | "storyboard_done"
  | "style_done"
  | "cds_done"
  | "rendering"
  | "done";

export type WorkflowInputMode = "structured" | "paste";

export function isWorkflowStep(step: string): step is WorkflowStep {
  return WORKFLOW_STEPS.some((item) => item.id === step);
}

export function getCurrentWorkflowStep(args: {
  status: StoryStatus | string;
  inputMode: WorkflowInputMode | string;
  characterCount: number;
}): WorkflowStep | null {
  const { status, characterCount } = args;
  if (status === "draft") return "story";
  if (status === "text_done") {
    return characterCount === 0 ? "extract" : "storyboard";
  }
  if (status === "storyboard_done") return "style";
  if (status === "style_done") return "cds";
  return null;
}

export function getCompletedWorkflowSteps(args: {
  status: StoryStatus | string;
  inputMode: WorkflowInputMode | string;
  characterCount: number;
}): WorkflowStep[] {
  const { status, inputMode, characterCount } = args;
  const completed: WorkflowStep[] = [];
  const hasStoryText = ["text_done", "storyboard_done", "style_done", "cds_done", "rendering", "done"].includes(status);
  const hasStoryboard = ["storyboard_done", "style_done", "cds_done", "rendering", "done"].includes(status);
  if (hasStoryText) {
    completed.push("story");
  }
  if (
    hasStoryboard ||
    (inputMode === "structured" && hasStoryText && characterCount > 0) ||
    (inputMode === "paste" && characterCount > 0)
  ) {
    completed.push("extract");
  }
  if (hasStoryboard) {
    completed.push("storyboard");
  }
  if (["style_done", "cds_done", "rendering", "done"].includes(status)) {
    completed.push("style");
  }
  if (["cds_done", "rendering", "done"].includes(status)) {
    completed.push("cds");
  }
  return completed;
}

export function getAccessibleWorkflowSteps(args: {
  status: StoryStatus | string;
  inputMode: WorkflowInputMode | string;
  characterCount: number;
}): WorkflowStep[] {
  const completed = getCompletedWorkflowSteps(args);
  const current = getCurrentWorkflowStep(args);
  return current && !completed.includes(current) ? [...completed, current] : completed;
}
