import { useEffect, useRef } from "react";
import { AnalogClockView } from "../components/AnalogClockView";
import { DayView } from "../components/DayView";
import { Sidebar } from "../components/Sidebar";
import { TaskDetailsPanel } from "../components/TaskDetailsPanel";
import { TaskTree } from "../components/TaskTree";
import { useAppStore } from "../store/useAppStore";

export function PlannerPage() {
  const activeView = useAppStore((state) => state.activeView);
  const loadTasks = useAppStore((state) => state.loadTasks);
  const isLoading = useAppStore((state) => state.isLoading);
  const errorMessage = useAppStore((state) => state.errorMessage);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;

    hasLoaded.current = true;
    void loadTasks();
  }, [loadTasks]);

  const showDetailsPanel = activeView === "tasks";

  return (
    <div className="app-shell">
      <Sidebar />

      {errorMessage ? <div className="app-error-banner">{errorMessage}</div> : null}

      <div className={showDetailsPanel ? "app-content-grid" : "app-content-grid full-width"}>
        <main className="main-panel">
          {isLoading ? <p className="loading-message">Loading...</p> : null}

          {activeView === "tasks" ? <TaskTree /> : null}
          {activeView === "clock" ? <AnalogClockView /> : null}
          {activeView === "day" ? <DayView /> : null}
        </main>

        {showDetailsPanel ? <TaskDetailsPanel /> : null}
      </div>
    </div>
  );
}