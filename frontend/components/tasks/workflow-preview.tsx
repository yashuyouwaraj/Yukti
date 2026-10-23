import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Play,
  Workflow,
} from "lucide-react";

import type {
  ExecutionResponse,
  ExecutionStatus,
  PlanResponse,
  PlanningStatus,
} from "@/types/workflow";

interface WorkflowPreviewProps {
  status: PlanningStatus;
  message: string;
  plan: PlanResponse | null;
  executionStatus: ExecutionStatus;
  execution: ExecutionResponse | null;
  executionMessage: string;
  onApproveAndRun: () => void;
}

export default function WorkflowPreview({
  status,
  message,
  plan,
  executionStatus,
  execution,
  executionMessage,
  onApproveAndRun,
}: WorkflowPreviewProps) {
  const steps = plan?.steps ?? [];
  const canExecute =
    status === "success" &&
    plan?.status === "ready" &&
    steps.length > 0 &&
    executionStatus !== "running" &&
    executionStatus !== "completed";

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Workflow size={17} className="text-violet-300" />
            Workflow preview
          </div>

          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400">
            {status === "planning"
              ? "Planning"
              : status === "error"
                ? "Needs attention"
                : executionStatus === "running"
                  ? "Running"
                  : executionStatus === "completed"
                    ? "Completed"
                    : executionStatus === "failed"
                      ? "Execution failed"
                      : status === "success"
                        ? "Plan received"
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

          {plan?.title && (
            <h2 className="mt-4 text-base font-semibold text-white">
              {plan.title}
            </h2>
          )}

          {steps.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className="flex gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-500/15 text-xs text-violet-200">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {step.description}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-600">
                      {step.action.replaceAll("_", " ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Proposed steps will appear here after a successful planning
              request.
            </p>
          )}

          {plan && steps.length > 0 && (
            <div className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3">
              <p className="text-xs leading-5 text-amber-100/80">
                Review every step before running. Browser actions may interact
                with external websites. Only approve tasks you understand and
                are authorized to perform.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onApproveAndRun}
            disabled={!canExecute}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {executionStatus === "running" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            {executionStatus === "running"
              ? "Executing workflow…"
              : executionStatus === "completed"
                ? "Workflow completed"
                : executionStatus === "failed"
                  ? "Run again"
                  : "Approve & Run"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium">
          <Clock3 size={17} className="text-cyan-300" />
          Execution results
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-sm text-slate-300">
            {executionStatus === "running"
              ? "Yukti is executing your approved workflow. Results will appear when execution finishes."
              : executionStatus === "completed"
                ? "Workflow execution completed successfully."
                : executionStatus === "failed"
                  ? "Execution stopped because a step failed."
                  : executionStatus === "idle"
                    ? "Approve a workflow to start browser execution."
                    : executionMessage}
          </p>

          {executionMessage && executionStatus !== "idle" && (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {executionMessage}
            </p>
          )}
        </div>

        {execution?.results && execution.results.length > 0 && (
          <ol className="mt-4 space-y-3">
            {execution.results.map((item, index) => (
              <li
                key={`${item.step_id}-${index}`}
                className="rounded-xl border border-white/[0.07] p-3"
              >
                <div className="flex items-start gap-2">
                  {item.status === "completed" ? (
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-400"
                    />
                  ) : (
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-rose-400"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200">
                      {item.step_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.status === "completed" ? "Completed" : "Failed"}
                    </p>

                    {item.error && (
                      <p className="mt-2 break-words text-xs leading-5 text-rose-300">
                        {item.error}
                      </p>
                    )}

                    {typeof item.result?.url === "string" && (
                      <p className="mt-2 break-all text-xs text-cyan-300">
                        URL: {item.result.url}
                      </p>
                    )}

                    {typeof item.result?.text === "string" && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-violet-300">
                          View extracted text
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-2 text-xs leading-5 text-slate-400">
                          {item.result.text}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
