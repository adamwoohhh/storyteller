import { describe, expect, it } from "vitest";
import { getStoryStepRedirectHref } from "@/lib/story-step-redirect";

describe("story step redirect helper", () => {
  it("redirects inaccessible workflow steps to the current accessible step", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "cds",
        currentWorkflowStep: "storyboard",
        accessibleSteps: ["story", "storyboard"],
      }),
    ).toBe("/s/story-1?step=storyboard");
  });

  it("redirects completed stories to edit mode when no workflow step is current", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "auto",
        currentWorkflowStep: null,
        accessibleSteps: ["story", "storyboard", "style", "cds"],
      }),
    ).toBe("/s/story-1?mode=edit");
  });

  it("does not redirect when the requested workflow step is accessible", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "storyboard",
        currentWorkflowStep: "storyboard",
        accessibleSteps: ["story", "storyboard"],
      }),
    ).toBeNull();
  });

  it("does not redirect explicit read or edit mode navigation", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "auto",
        currentWorkflowStep: "style",
        accessibleSteps: ["story", "storyboard", "style"],
        usesModeNavigation: true,
      }),
    ).toBeNull();
  });
});
