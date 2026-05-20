import { Sidebar } from "../components/Sidebar";
import { TaskTree } from "../components/TaskTree";
import { TaskDetailsPanel } from "../components/TaskDetailsPanel";
import { AnalogClockView } from "../components/AnalogClockView";
import { DayView } from "../components/DayView";
import { ResearchPanel } from "../components/ResearchPanel";
import { useAppStore } from "../store/useAppStore";

function ActiveView() {
  const activeView = useAppStore((state) => state.activeView);

  if (activeView === "clock") return <AnalogClockView />;
  if (activeView === "day") return <DayView />;
  if (activeView === "research") return <ResearchPanel />;

  return <TaskTree />;
}

export function PlannerPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <ActiveView />
      </main>
      <TaskDetailsPanel />
    </div>
  );
}
