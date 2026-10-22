
"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

const examples = [
  "Research a topic and summarize reliable sources",
  "Compare products and organize the findings",
  "Find relevant job listings matching my experience",
];

interface TaskPromptProps {
  loading: boolean;
  onSubmit: (prompt: string) => Promise<void>;
}

export default function TaskPrompt({
  loading,
  onSubmit,
}: TaskPromptProps) {
  const [prompt, setPrompt] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  async function handleSubmit() {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < 3) {
      setValidationMessage(
        "Describe a task in a little more detail to get started.",
      );
      return;
    }

    setValidationMessage("");
    await onSubmit(trimmedPrompt);
  }

  return (
    <section className="mt-9">
      <div className="rounded-2xl border border-white/[0.12] bg-[#101528] p-3 shadow-2xl shadow-black/20 sm:p-4">
        <label
          htmlFor="task-prompt"
          className="mb-3 block px-1 text-sm font-medium text-slate-200"
        >
          What would you like to automate?
        </label>

        <textarea
          id="task-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key === "Enter" &&
              !loading
            ) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Example: Research a topic from reliable public sources and organize the findings into a table…"
          className="min-h-[130px] w-full resize-y rounded-xl border border-white/[0.07] bg-[#0b1020] p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-400/50"
        />

        {validationMessage && (
          <p role="alert" className="px-1 pt-2 text-xs text-amber-200">
            {validationMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 px-1 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Start with public websites and low-risk tasks.
          </p>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Planning…" : "Create workflow"}
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setPrompt(example);
              setValidationMessage("");
            }}
            className="rounded-full border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-left text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200"
          >
            <Sparkles
              size={12}
              className="mr-1.5 inline-block"
              aria-hidden="true"
            />
            {example}
          </button>
        ))}
      </div>

      <p className="mt-2 text-right text-[11px] text-slate-600">
        Tip: press Ctrl+Enter to submit
      </p>
    </section>
  );
}
