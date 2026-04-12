import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiFileText, FiPlus, FiStar } from "react-icons/fi";
import { cn } from "../../utils/cn";

const demoItems = [
  { id: "welcome", title: "Welcome", icon: FiFileText },
  { id: "quick-notes", title: "Quick Notes", icon: FiStar },
];

export function Sidebar({ collapsed, onToggle, onCreate }) {
  const items = useMemo(() => demoItems, []);

  return (
    <aside
      className={cn(
        "h-dvh border-r bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/60",
        "border-slate-200 dark:border-slate-800",
        collapsed ? "w-[68px]" : "w-[280px]",
        "transition-[width] duration-200 ease-out"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onToggle}
          className="nb-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Notty Box</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">Notes</div>
          </div>
        )}
      </div>

      <div className={cn("p-2", collapsed && "px-2")}>
        <button
          type="button"
          onClick={onCreate}
          className={cn(
            "nb-focus-ring inline-flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium",
            "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
            collapsed && "justify-center px-0"
          )}
        >
          <FiPlus className="shrink-0" />
          {!collapsed && <span>Create</span>}
        </button>

        <nav className="mt-3 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.id}
                to={`/p/${it.id}`}
                className={({ isActive }) =>
                  cn(
                    "nb-focus-ring group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                    "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
                    isActive && "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50",
                    collapsed && "justify-center px-0"
                  )
                }
              >
                <Icon className="shrink-0 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
                {!collapsed && <span className="truncate">{it.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

