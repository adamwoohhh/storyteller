"use client";

import { cn } from "@/lib/utils";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/lib/workflow-steps";
import { createContext, useContext } from "react";

type StepNavigation = {
  accessibleSteps: WorkflowStep[];
  onStepSelect: (step: WorkflowStep) => void;
};

const StepNavigationContext = createContext<StepNavigation | null>(null);

export function StepNavigationProvider({
  value,
  children,
}: {
  value: StepNavigation;
  children: React.ReactNode;
}) {
  return (
    <StepNavigationContext.Provider value={value}>
      {children}
    </StepNavigationContext.Provider>
  );
}

export function StepFrame({
  title,
  description,
  currentStep,
  children,
  className,
}: {
  title: string;
  description?: string;
  currentStep: WorkflowStep;
  children: React.ReactNode;
  className?: string;
}) {
  const navigation = useContext(StepNavigationContext);

  return (
    <main className="story-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className={cn("mx-auto flex w-full max-w-4xl flex-col items-center", className)}>
        <nav className="mb-6 flex flex-wrap justify-center gap-2" aria-label="创作步骤">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const canNavigate = navigation?.accessibleSteps.includes(step.id) ?? false;
            return (
              <button
                key={step.id}
                type="button"
                className={cn(
                  "story-chip transition",
                  isActive && "story-chip-active",
                  !canNavigate && "cursor-not-allowed opacity-45",
                  canNavigate && !isActive && "hover:-translate-y-0.5 hover:bg-secondary",
                )}
                disabled={!canNavigate || isActive}
                aria-current={isActive ? "step" : undefined}
                onClick={() => navigation?.onStepSelect(step.id)}
              >
                {step.label}
              </button>
            );
          })}
        </nav>

        <header className="mb-7 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[1.4rem] border-2 border-[#5a3029] bg-secondary shadow-[0_5px_0_#5a3029]">
            <span className="size-7 rounded-full bg-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </header>

        <section className="story-panel-green w-full p-4 sm:p-6 lg:p-7">{children}</section>
      </div>
    </main>
  );
}
