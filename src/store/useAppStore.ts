import { create } from "zustand";
import { sampleTasks, sampleTimeBlocks } from "../data/sampleTasks";
import type { AppView, Task, TimeBlock } from "../types/task";

type AppState = {
  activeView: AppView;
  selectedTaskId: string | null;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  setActiveView: (view: AppView) => void;
  selectTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeView: "tasks",
  selectedTaskId: "task-1",
  tasks: sampleTasks,
  timeBlocks: sampleTimeBlocks,
  setActiveView: (view) => set({ activeView: view }),
  selectTask: (taskId) => set({ selectedTaskId: taskId }),
  toggleTaskComplete: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completionSource: !task.completed ? "manual" : undefined,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    })),
}));
