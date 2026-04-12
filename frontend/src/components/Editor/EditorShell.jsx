import { FiBold, FiHash, FiItalic, FiList, FiType } from "react-icons/fi";

export function EditorShell() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="border-b border-slate-200 bg-white/70 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-slate-800 dark:bg-slate-950/40 sm:px-4">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton label="Text">
            <FiType />
          </ToolbarButton>
          <ToolbarButton label="Bold">
            <FiBold />
          </ToolbarButton>
          <ToolbarButton label="Italic">
            <FiItalic />
          </ToolbarButton>
          <ToolbarButton label="Heading">
            <FiHash />
          </ToolbarButton>
          <ToolbarButton label="List">
            <FiList />
          </ToolbarButton>

          <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
            Tip: we’ll swap this for TipTap next.
          </div>
        </div>
      </div>

      <main className="flex-1 px-3 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <input
            className="nb-focus-ring w-full rounded-lg border border-transparent bg-transparent px-1 py-2 text-3xl font-semibold placeholder:text-slate-400 focus:border-slate-200 dark:placeholder:text-slate-500 dark:focus:border-slate-800"
            placeholder="Untitled"
            defaultValue="Welcome"
          />
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              This is the initial layout shell. Next we’ll add the document tree, persistence,
              and the TipTap editor.
            </p>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Try resizing the window: sidebar collapses on mobile via the menu button.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolbarButton({ label, children }) {
  return (
    <button
      type="button"
      className="nb-focus-ring inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-50"
      aria-label={label}
      title={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

