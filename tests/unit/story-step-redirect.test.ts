import { describe, expect, it } from "vitest";
import { getStoryStepRedirectHref } from "@/lib/story-step-redirect";

describe("story step redirect helper", () => {
  it("redirects inaccessible workflow steps to the current accessible step", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "cds",
        currentWorkflowStep: "extract",
        accessibleSteps: ["story", "extract"],
      }),
    ).toBe("/s/story-1?step=extract");
  });

  it("redirects completed stories to edit mode when no workflow step is current", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "auto",
        currentWorkflowStep: null,
        accessibleSteps: ["story", "extract", "storyboard", "style", "cds"],
      }),
    ).toBe("/s/story-1?mode=edit");
  });

  it("does not redirect when the requested workflow step is accessible", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "extract",
        currentWorkflowStep: "extract",
        accessibleSteps: ["story", "extract"],
      }),
    ).toBeNull();
  });

  it("does not redirect explicit read or edit mode navigation", () => {
    expect(
      getStoryStepRedirectHref({
        storyId: "story-1",
        step: "auto",
        currentWorkflowStep: "style",
        accessibleSteps: ["story", "extract", "storyboard", "style"],
        usesModeNavigation: true,
      }),
    ).toBeNull();
  });
});
