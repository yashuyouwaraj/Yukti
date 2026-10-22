
import {
  Bot,
  CheckCircle2,
  Clock3,
  Workflow,
} from "lucide-react";
import type { PlanResponse, PlanningStatus } from "@/types/workflow";

interface WorkflowPreviewProps {
  status: PlanningStatus;
  message: string;
  plan: PlanResponse | null;
}

export default function WorkflowPreview({
  status,
  message,
  plan,
}: WorkflowPreviewProps) {
  const steps = plan?.steps ?? [];

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Workflow size={17} className="text-violet-300" />
            Workflow preview
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500">
            {status === "planning"
              ? "Planning"
              : status === "success"
                ? "Plan received"
                : status === "error"
                  ? "Needs attention"
                  : "Not started"}
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-white/[0.12] px-5 py-5">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-slate-400">
            <Bot size={20} aria-hidden="true" />
          </div>

          <p
            role="status"
            aria-live="polite"
            className="text-sm leading-6 text-slate-300"
          >
            {message}
          </p>

          {steps.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li
                  key={step.id ?? `${step.title ?? step.action ?? "step"}-${index}`}
                  className="flex gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-500/15 text-xs text-violet-200">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">
                      {step.title ?? step.action ?? `Step ${index + 1}`}
                    </p>
                    {step.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {step.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-xs text-slate-600">
              {status === "success"
                ? "The endpoint responded, but no structured steps were returned."
                : "Proposed steps will appear here when supported by the API."}
            </p>
          )}

          {status === "success" && (
            <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/70">
              Review the plan before execution. Receiving a plan does not
              execute a browser workflow.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium">
          <Clock3 size={17} className="text-cyan-300" />
          Recent activity
        </div>

        <div className="flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] px-5 text-center">
          <CheckCircle2
            size={21}
            className="mb-3 text-slate-600"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-400">
            {status === "planning"
              ? "Requesting a plan from the API…"
              : status === "success"
                ? "Planning request completed."
                : status === "error"
                  ? "The planning request needs attention."
                  : "Your task history will appear here."}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            {status === "idle" ? "No runs yet" : "Current session"}
          </p>
        </div>
      </div>
    </section>
  );
}
