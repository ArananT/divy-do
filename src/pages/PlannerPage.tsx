import { useEffect, useRef } from "react";
import { AnalogClockView } from "../components/AnalogClockView";
import { DayView } from "../components/DayView";
import { ResearchPanel } from "../components/ResearchPanel";
import { Sidebar } from "../components/Sidebar";
import { TaskDetailsPanel } from "../components/TaskDetailsPanel";
import { TaskTree } from "../components/TaskTree";
import { useAppStore } from "../store/useAppStore";

function ActiveView() {
  const activeView = useAppStore((state) => state.activeView);

  if (activeView === "clock") return <AnalogClockView />;
  if (activeView === "day") return <DayView />;
  if (activeView === "research") return <ResearchPanel />;
  return <TaskTree />;
}

export function PlannerPage() {
  const loadTasks = useAppStore((state) => state.loadTasks);
  const hasLoadedTasks = useRef(false);

  useEffect(() => {
    if (hasLoadedTasks.current) return;

    hasLoadedTasks.current = true;
    void loadTasks();
  }, [loadTasks]);

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