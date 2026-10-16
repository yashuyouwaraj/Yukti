"use client";

import { useState } from "react";
import { ArrowUp, Bot, CheckCircle2, CircleHelp, Clock3, FileText, Home, Layers3, ListTodo, Settings2, Sparkles, Workflow } from "lucide-react";

const examples = [
  "Research a topic and summarize reliable sources",
  "Compare products and organize the findings",
  "Find relevant job listings matching my experience",
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("Your workflow will appear here after you create a task.");
  const [loading, setLoading] = useState(false);

  async function makePlan() {
    if (prompt.trim().length < 3) {
      setNotice("Describe a task in a little more detail to get started.");
      return;
    }
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${base}/api/plan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setNotice(data.message || "The planning endpoint responded, but the workflow planner is not implemented yet.");
    } catch {
      setNotice("Can't reach the Yukti API yet. Start the backend, then try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.08] bg-[#0b1020] p-5 md:flex md:flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400 shadow-lg shadow-violet-900/30"><Workflow size={22} strokeWidth={2.5} /></div>
            <div><div className="text-xl font-semibold tracking-tight">Yukti</div><div className="text-[11px] text-slate-500">INTELLIGENCE IN ACTION</div></div>
          </div>
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</div>
          <nav className="space-y-1 text-sm">
            <NavItem icon={<Home size={17}/>} label="Home" active />
            <NavItem icon={<Sparkles size={17}/>} label="New task" />
            <NavItem icon={<Layers3 size={17}/>} label="My workflows" />
            <NavItem icon={<ListTodo size={17}/>} label="Run history" />
            <NavItem icon={<FileText size={17}/>} label="Templates" />
          </nav>
          <div className="mt-auto space-y-1 border-t border-white/[0.08] pt-4 text-sm">
            <NavItem icon={<Settings2 size={17}/>} label="Settings" />
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-300"><CircleHelp size={14}/> Getting started</div>
              <p className="text-xs leading-5 text-slate-500">Create a task, review the plan, then approve it before execution.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[72px] items-center justify-between border-b border-white/[0.08] px-5 md:px-10">
            <div><div className="text-sm text-slate-400">Workspace / <span className="text-slate-100">Home</span></div></div>
            <div className="flex items-center gap-3"><span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">MVP preview</span><div className="grid h-9 w-9 place-items-center rounded-full border border-violet-400/30 bg-violet-500/15 text-sm font-semibold text-violet-200">Y</div></div>
          </header>

          <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs text-violet-200"><Sparkles size={13}/> Your AI teammate for the real world</div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Let’s get things <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">done.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Describe the work. Yukti will help turn it into a clear workflow you can review before anything runs.</p>

            <div className="mt-9 rounded-2xl border border-white/[0.12] bg-[#101528] p-3 shadow-2xl shadow-black/20 sm:p-4">
              <label htmlFor="task-prompt" className="mb-3 block px-1 text-sm font-medium text-slate-200">What would you like to automate?</label>
              <textarea id="task-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Example: Research a topic from reliable public sources and organize the findings into a table…" className="min-h-[130px] w-full resize-y rounded-xl border border-white/[0.07] bg-[#0b1020] p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-400/50" />
              <div className="flex flex-col gap-3 px-1 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Start with public websites and low-risk tasks.</p>
                <button onClick={makePlan} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{loading ? "Connecting…" : "Create workflow"}<ArrowUp size={16}/></button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {examples.map((example) => <button key={example} onClick={() => setPrompt(example)} className="rounded-full border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-left text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200">{example}</button>)}
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
                <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium"><Workflow size={17} className="text-violet-300"/> Workflow preview</div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500">Not started</span></div>
                <div className="flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] px-5 text-center"><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-slate-500"><Bot size={20}/></div><p className="text-sm text-slate-300">{notice}</p><p className="mt-2 text-xs text-slate-600">Workflow generation is not implemented yet.</p></div>
              </div>
              <div className="rounded-2xl border border-white/[0.09] bg-[#0d1222] p-5">
                <div className="mb-5 flex items-center gap-2 text-sm font-medium"><Clock3 size={17} className="text-cyan-300"/> Recent activity</div>
                <div className="flex min-h-[112px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] px-5 text-center"><CheckCircle2 size={21} className="mb-3 text-slate-600"/><p className="text-sm text-slate-400">Your task history will appear here.</p><p className="mt-2 text-xs text-slate-600">No runs yet</p></div>
              </div>
            </div>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-5 text-amber-100/70"><CircleHelp size={16} className="mt-0.5 shrink-0 text-amber-200/70"/><p><span className="font-medium text-amber-100">Development preview:</span> this dashboard is the first UI scaffold. AI planning, browser execution, task storage, and exports are not connected yet. Yukti will require plan review and explicit approval before running workflows.</p></div>
            <footer className="mt-10 border-t border-white/[0.07] pt-5 text-xs text-slate-600">Yukti · Intelligence that gets things done.</footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "border border-violet-400/15 bg-violet-500/10 text-violet-100" : "text-slate-400"}`}>{icon}<span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300"/>}</div>;
}
