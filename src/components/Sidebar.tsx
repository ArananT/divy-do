import { useAppStore } from "../store/useAppStore";
import type { AppView } from "../types/task";

const navItems: Array<{ id: AppView; label: string; description: string }> = [
  { id: "tasks", label: "Task Tree", description: "Organize subtasks" },
  { id: "clock", label: "Clock View", description: "Plan visually" },
  { id: "day", label: "Day View", description: "Daily timeline" },
  { id: "research", label: "Research", description: "Design notes" },
];

export function Sidebar() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <aside className="sidebar">
      <div className="app-title">
        <span className="app-title-mark">◎</span>
        <div>
          <h1>Divy-Do</h1>
          <p>Task trees + time blocking</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? "nav-item active" : "nav-item"}
            onClick={() => setActiveView(item.id)}
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
