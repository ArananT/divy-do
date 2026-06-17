import { useAppStore } from "../store/useAppStore";
import type { AppView } from "../types/task";

type NavItem = {
  view: AppView;
  label: string;
  description: string;
};

const navItems: NavItem[] = [
  {
    view: "tasks",
    label: "Task Tree",
    description: "Current working task hierarchy",
  },
  {
    view: "clock",
    label: "Future Analog Time-Block View",
    description: "Planned circular scheduling view",
  },
  {
    view: "day",
    label: "Future Vertical Day View",
    description: "Planned daily schedule layout",
  },
  {
    view: "research",
    label: "Project Notes",
    description: "Research and design notes",
  },
];

export function Sidebar() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">Honours Project Prototype</p>
        <h1>Divy-Do</h1>
        <p className="sidebar-description">
          Early desktop prototype for tree-based task planning and future time-blocking views.
        </p>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.view}
            className={activeView === item.view ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => setActiveView(item.view)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      <div className="prototype-note">
        <strong>Prototype status</strong>
        <p>
          Task saving and hierarchy are working. The time-blocking screens are labelled placeholders
          for upcoming milestones.
        </p>
      </div>
    </aside>
  );
}