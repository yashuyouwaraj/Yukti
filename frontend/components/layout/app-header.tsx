
import { ChevronRight } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-white/[0.08] px-5 md:px-10">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Workspace</span>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="font-medium text-slate-100">Home</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
          MVP preview
        </span>
        <div
          aria-label="Yukti account"
          className="grid h-9 w-9 place-items-center rounded-full border border-violet-400/30 bg-violet-500/15 text-sm font-semibold text-violet-200"
        >
          Y
        </div>
      </div>
    </header>
  );
}
