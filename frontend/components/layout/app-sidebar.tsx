
import Image from "next/image";
import {
  CircleHelp,
  FileText,
  Home,
  Layers3,
  ListTodo,
  Settings2,
  Sparkles,
} from "lucide-react";

const navigationItems = [
  { label: "Home", icon: Home, active: true },
  { label: "New task", icon: Sparkles, active: false },
  { label: "My workflows", icon: Layers3, active: false },
  { label: "Run history", icon: ListTodo, active: false },
  { label: "Templates", icon: FileText, active: false },
];

export default function AppSidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.08] bg-[#0b1020] p-5 md:flex md:flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <Image
            src="/brand/yukti-logo.png"
            alt="Yukti"
            fill
            sizes="44px"
            priority
            className="object-contain p-1"
          />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold tracking-tight text-white">
            Yukti
          </div>
          <div className="text-[10px] leading-4 tracking-wide text-slate-500">
            INTELLIGENCE THAT GETS THINGS DONE
          </div>
        </div>
      </div>

      <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Workspace
      </div>

      <nav aria-label="Main navigation" className="space-y-1 text-sm">
        {navigationItems.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              active
                ? "border-violet-400/15 bg-violet-500/10 text-violet-100"
                : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" />
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/[0.08] pt-4 text-sm">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400">
          <Settings2 size={17} aria-hidden="true" />
          <span>Settings</span>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-300">
            <CircleHelp size={14} aria-hidden="true" />
            Getting started
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Describe a task, review the proposed plan, and approve it before
            execution.
          </p>
        </div>
      </div>
    </aside>
  );
}
