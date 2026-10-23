
"use client";

import { useRef, useState } from "react";
import { CircleHelp, Sparkles } from "lucide-react";

import AppHeader from "@/components/layout/app-header";
import AppSidebar from "@/components/layout/app-sidebar";
import TaskPrompt from "@/components/tasks/task-prompt";
import WorkflowPreview from "@/components/tasks/workflow-preview";

import { createPlan, executePlan } from "@/lib/api-client";

import type {
  ExecutionResponse,
  ExecutionStatus,
  PlanResponse,
  PlanningStatus,
} from "@/types/workflow";

export default function HomePage() {
  const [status, setStatus] = useState<PlanningStatus>("idle");
  const [message, setMessage] = useState(
    "Your workflow plan will appear here after you create a task.",
  );
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus>("idle");
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);
  const [executionMessage, setExecutionMessage] = useState("");
  const planningRequest = useRef(false);
  const executionRequest = useRef(false);

  async function handleCreatePlan(prompt: string) {
    if (planningRequest.current || executionRequest.current) {
      return;
    }

    planningRequest.current = true;
    setStatus("planning");
    setPlan(null);
    setMessage("Sending your request to the Yukti planning API…");

    setExecutionStatus("idle");
    setExecution(null);
    setExecutionMessage("");

    try {
      const response = await createPlan({ prompt });
      setPlan(response);

      if (response.status !== "ready" || !response.steps?.length) {
        setStatus("error");
        setMessage(
          response.message || "The API did not return an executable workflow.",
        );
        return;
      }

      setStatus("success");
      setMessage(
        response.message || "Review the workflow below before approving it.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while requesting a plan.",
      );
    } finally {
      planningRequest.current = false;
    }
  }

  async function handleApproveAndRun() {
    if (
      executionRequest.current ||
      planningRequest.current ||
      !plan ||
      plan.status !== "ready" ||
      !plan.title ||
      !plan.steps.length ||
      executionStatus === "running" ||
      executionStatus === "completed"
    ) {
      return;
    }

    executionRequest.current = true;
    const confirmed = window.confirm(
      `Approve and execute "${plan.title ?? "this workflow"}"? Review all steps before continuing.`,
    );

    if (!confirmed) {
      executionRequest.current = false;
      return;
    }

    setExecutionStatus("running");
    setExecution(null);
    setExecutionMessage("Sending the approved workflow to the browser executor…");

    try {
      const result = await executePlan({
        title: plan.title,
        steps: plan.steps,
      });
      setExecution(result);

      if (result.status === "completed") {
        setExecutionStatus("completed");
        setExecutionMessage("All workflow steps completed.");
      } else {
        setExecutionStatus("failed");
        const failedStep = result.results.find(
          (item) => item.status === "failed",
        );

        setExecutionMessage(
          failedStep
            ? `Execution stopped at ${failedStep.step_id}: ${failedStep.error ?? "Unknown step error"}`
            : "Execution failed. Review the step results.",
        );
      }
    } catch (error) {
      setExecutionStatus("failed");
      setExecutionMessage(
        error instanceof Error
          ? error.message
          : "An unexpected execution error occurred.",
      );
    } finally {
      executionRequest.current = false;
    }
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="flex min-h-screen">
        <AppSidebar />

        <section className="min-w-0 flex-1">
          <AppHeader />

          <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs text-violet-200">
              <Sparkles size={13} aria-hidden="true" />
              Your AI teammate for the real world
            </div>

            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Let&apos;s get things{" "}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                done.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Describe the work. Yukti turns it into a clear workflow you can
              review and explicitly approve before browser execution.
            </p>

            <TaskPrompt
              loading={status === "planning" || executionStatus === "running"}
              onSubmit={handleCreatePlan}
            />

            <WorkflowPreview
              status={status}
              message={message}
              plan={plan}
              executionStatus={executionStatus}
              execution={execution}
              executionMessage={executionMessage}
              onApproveAndRun={handleApproveAndRun}
            />

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-5 text-amber-100/70">
              <CircleHelp
                size={16}
                className="mt-0.5 shrink-0 text-amber-200/70"
                aria-hidden="true"
              />
              <p>
                <span className="font-medium text-amber-100">
                  Development preview:
                </span>{" "}
                Browser execution is synchronous, and results appear after the
                run finishes. Persistent task history, background jobs, and
                exports are not implemented yet. Review each step and only run
                workflows you are authorized to perform.
              </p>
            </div>

            <footer className="mt-10 border-t border-white/[0.07] pt-5 text-xs text-slate-600">
              Yukti · Intelligence that gets things done.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
