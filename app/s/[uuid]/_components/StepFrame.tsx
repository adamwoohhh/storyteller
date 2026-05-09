import { cn } from "@/lib/utils";

const steps = [
  { id: "story", label: "故事" },
  { id: "extract", label: "角色" },
  { id: "storyboard", label: "分镜" },
  { id: "style", label: "画风" },
  { id: "cds", label: "角色图" },
  { id: "render", label: "插图" },
] as const;

export type WorkflowStep = (typeof steps)[number]["id"];

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
  return (
    <main className="story-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className={cn("mx-auto flex w-full max-w-4xl flex-col items-center", className)}>
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn("story-chip", step.id === currentStep && "story-chip-active")}
            >
              {step.label}
            </span>
          ))}
        </div>

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
