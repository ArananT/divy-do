import { useAppStore } from "../store/useAppStore";
import type { AppView } from "../types/task";

type NavItem = {
  view: AppView;
  label: string;
};

const navItems: NavItem[] = [
  { view: "tasks", label: "Task Tree" },
  { view: "clock", label: "Analog Time Blocking" },
  { view: "day", label: "Vertical Day View" },
];

export function Sidebar() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <header className="top-nav-shell">
      <div className="top-nav-brand">
        <span className="brand-mark">D</span>
        <strong>Divy-Do</strong>
      </div>

      <nav className="top-nav-buttons" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.view}
            className={activeView === item.view ? "top-nav-button active" : "top-nav-button"}
            type="button"
            onClick={() => setActiveView(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}