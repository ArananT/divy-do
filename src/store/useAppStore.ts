import { create } from "zustand";
import { sampleTimeBlocks } from "../data/sampleTasks";
import {
  createChildTask,
  createRootTask,
  deleteTaskAndChildren,
  initializeTaskData,
  renameTask,
  resetTasksToSampleData,
  setTaskCompleted,
} from "../services/taskService";
import type { AppView, Task, TimeBlock } from "../types/task";

type AppState = {
  activeView: AppView;
  selectedTaskId: string | null;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  errorMessage: string | null;
  setActiveView: (view: AppView) => void;
  selectTask: (taskId: string) => void;
  loadTasks: () => Promise<void>;
  resetSampleData: () => Promise<void>;
  addRootTask: (title: string) => Promise<void>;
  addChildTask: (parentId: string, title: string) => Promise<void>;
  renameSelectedTask: (title: string) => Promise<void>;
  deleteSelectedTask: () => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeView: "tasks",
  selectedTaskId: null,
  tasks: [],
  timeBlocks: sampleTimeBlocks,
  isLoading: false,
  errorMessage: null,

  setActiveView: (view) => set({ activeView: view }),

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  loadTasks: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await initializeTaskData();

      set({
        tasks,
        selectedTaskId: get().selectedTaskId ?? tasks[0]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to load tasks from the local database.",
      });
    }
  },

  resetSampleData: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await resetTasksToSampleData();

      set({
        tasks,
        selectedTaskId: tasks[0]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to reset sample task data.",
      });
    }
  },

  addRootTask: async (title) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await createRootTask(cleanTitle);

      set({
        tasks,
        selectedTaskId: tasks[tasks.length - 1]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to create root task.",
      });
    }
  },

  addChildTask: async (parentId, title) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const parent = get().tasks.find((task) => task.id === parentId);

    if (!parent) {
      set({ errorMessage: "No parent task was selected." });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await createChildTask(parent, cleanTitle);

      set({
        tasks,
        selectedTaskId: tasks[tasks.length - 1]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to create child task.",
      });
    }
  },

  renameSelectedTask: async (title) => {
    const cleanTitle = title.trim();
    const selectedTaskId = get().selectedTaskId;

    if (!cleanTitle || !selectedTaskId) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await renameTask(selectedTaskId, cleanTitle);

      set({
        tasks,
        selectedTaskId,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to rename task.",
      });
    }
  },

  deleteSelectedTask: async () => {
    const selectedTaskId = get().selectedTaskId;

    if (!selectedTaskId) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await deleteTaskAndChildren(get().tasks, selectedTaskId);

      set({
        tasks,
        selectedTaskId: tasks[0]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to delete task.",
      });
    }
  },

  toggleTaskComplete: async (taskId) => {
    const task = get().tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) return;

    const nextCompletedState = !task.completed;

    set({
      tasks: get().tasks.map((currentTask) =>
        currentTask.id === taskId
          ? {
              ...currentTask,
              completed: nextCompletedState,
              completionSource: nextCompletedState ? "manual" : undefined,
              updatedAt: new Date().toISOString(),
            }
          : currentTask,
      ),
    });

    try {
      const tasks = await setTaskCompleted(task, nextCompletedState);
      set({ tasks });
    } catch (error) {
      console.error(error);
      set({
        errorMessage: "Failed to update task completion in the local database.",
      });
    }
  },
}));