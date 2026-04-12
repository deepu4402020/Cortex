import { FiMenu, FiMoon, FiSun } from "react-icons/fi";

export function Topbar({ onMobileMenu, theme, setTheme }) {
  const isDark = theme === "dark";
  const isLight = theme === "light";
  const isSystem = theme === "system";

  function cycleTheme() {
    if (isSystem) setTheme("light");
    else if (isLight) setTheme("dark");
    else setTheme("system");
  }

  const label = isSystem ? "Theme: System" : isLight ? "Theme: Light" : "Theme: Dark";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 sm:px-4">
      <button
        type="button"
        onClick={onMobileMenu}
        className="nb-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-50 lg:hidden"
        aria-label="Open sidebar"
      >
        <FiMenu />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">Untitled</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">Notion-style editor shell</div>
      </div>

      <button
        type="button"
        onClick={cycleTheme}
        className="nb-focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        aria-label={label}
        title={label}
      >
        {isDark ? <FiMoon /> : <FiSun />}
        <span className="hidden sm:inline">{isSystem ? "System" : isLight ? "Light" : "Dark"}</span>
      </button>
    </header>
  );
}

