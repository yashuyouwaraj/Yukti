
"use client";

import { useState } from "react";
import { CircleHelp, Sparkles } from "lucide-react";
import AppHeader from "@/components/layout/app-header";
import AppSidebar from "@/components/layout/app-sidebar";
import TaskPrompt from "@/components/tasks/task-prompt";
import WorkflowPreview from "@/components/tasks/workflow-preview";
import { createPlan } from "@/lib/api-client";
import type { PlanResponse, PlanningStatus } from "@/types/workflow";

export default function HomePage() {
  const [status, setStatus] = useState<PlanningStatus>("idle");
  const [message, setMessage] = useState(
    "Your workflow plan will appear here after you create a task.",
  );
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  async function handleCreatePlan(prompt: string) {
    setStatus("planning");
    setPlan(null);
    setMessage("Sending your request to the Yukti planning API…");

    try {
      const response = await createPlan({ prompt });
      setPlan(response);
      setStatus("success");
      setMessage(
        response.message ??
          "The planning endpoint responded successfully. Check the response below.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while requesting a plan.",
      );
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
              Describe the work. Yukti helps turn it into a clear workflow you
              can review before anything runs.
            </p>

            <TaskPrompt
              loading={status === "planning"}
              onSubmit={handleCreatePlan}
            />

            <WorkflowPreview
              status={status}
              message={message}
              plan={plan}
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
                this dashboard connects to the planning endpoint only. Browser
                execution, task persistence, run history, and exports are not
                implemented here. Yukti must require plan review and explicit
                approval before executing a workflow.
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
