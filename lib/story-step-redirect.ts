import { isWorkflowStep, type WorkflowStep } from "./workflow-steps";

export function getStoryStepRedirectHref({
  storyId,
  step,
  currentWorkflowStep,
  accessibleSteps,
  usesModeNavigation = false,
}: {
  storyId: string;
  step: string;
  currentWorkflowStep: WorkflowStep | null;
  accessibleSteps: WorkflowStep[];
  usesModeNavigation?: boolean;
}) {
  if (usesModeNavigation) return null;

  if (isWorkflowStep(step) && !accessibleSteps.includes(step)) {
    return currentWorkflowStep ? `/s/${storyId}?step=${currentWorkflowStep}` : `/s/${storyId}?mode=edit`;
  }

  if (!isWorkflowStep(step)) {
    return currentWorkflowStep ? `/s/${storyId}?step=${currentWorkflowStep}` : `/s/${storyId}?mode=edit`;
  }

  return null;
}
