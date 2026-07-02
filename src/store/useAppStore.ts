import { create } from "zustand";
import {
  createChildTask,
  createRootTask,
  deleteTaskAndChildren,
  initializeTaskData,
  renameTask,
  resetTasksToSampleData,
  setTaskCompleted,
  updateTaskDetails,
} from "../services/taskService";
import {
  createPlannedTimeBlock,
  deleteSavedTimeBlock,
  getActiveTimeBlock,
  loadSavedTimeBlocks,
  startOrSwitchTrackedTimeBlock,
  stopTrackedTimeBlock,
} from "../services/timeBlockService";
import type {
  AppView,
  ClockTab,
  ClockViewState,
  PlannedTimeBlockInput,
  Task,
  TaskDetailsUpdate,
  TaskFilter,
  TimeBlock,
} from "../types/task";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getTodayInputValue() {
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getCurrentHourStart() {
  const now = new Date();

  return `${pad(now.getHours())}:00`;
}

function addOneHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const nextHours = (hours + 1) % 24;

  return `${pad(nextHours)}:${pad(minutes)}`;
}

function getDefaultClockViewState(): ClockViewState {
  const currentHourStart = getCurrentHourStart();
  const currentHourEnd = addOneHour(currentHourStart);

  return {
    activeClockTab: "planned",
    clockDate: getTodayInputValue(),
    clockStartTime: currentHourStart,
    clockEndTime: currentHourEnd,
    plannedStartTime: currentHourStart,
    plannedEndTime: currentHourEnd,
    completeTaskOnFinish: false,
  };
}

type AppState = {
  activeView: AppView;
  selectedTaskId: string | null;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  taskFilter: TaskFilter;
  clockView: ClockViewState;
  isLoading: boolean;
  errorMessage: string | null;
  setActiveView: (view: AppView) => void;
  setTaskFilter: (filter: TaskFilter) => void;
  setClockTab: (tab: ClockTab) => void;
  setClockViewState: (updates: Partial<ClockViewState>) => void;
  setClockToCurrentHour: () => void;
  selectTask: (taskId: string) => void;
  loadTasks: () => Promise<void>;
  loadTimeBlocks: () => Promise<void>;
  resetSampleData: () => Promise<void>;
  addRootTask: (title: string) => Promise<void>;
  addChildTask: (parentId: string, title: string) => Promise<void>;
  renameSelectedTask: (title: string) => Promise<void>;
  updateSelectedTaskDetails: (updates: TaskDetailsUpdate) => Promise<void>;
  deleteSelectedTask: () => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  addPlannedTimeBlock: (input: Omit<PlannedTimeBlockInput, "taskId">) => Promise<void>;
  startTrackingSelectedTask: () => Promise<void>;
  stopTrackingCurrentTask: () => Promise<void>;
  deleteTimeBlock: (timeBlockId: string) => Promise<void>;
  getActiveBlock: () => TimeBlock | undefined;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeView: "tasks",
  selectedTaskId: null,
  tasks: [],
  timeBlocks: [],
  taskFilter: "all",
  clockView: getDefaultClockViewState(),
  isLoading: false,
  errorMessage: null,

  setActiveView: (view) => set({ activeView: view }),

  setTaskFilter: (filter) => set({ taskFilter: filter }),

  setClockTab: (tab) =>
    set((state) => ({
      clockView: {
        ...state.clockView,
        activeClockTab: tab,
      },
    })),

  setClockViewState: (updates) =>
    set((state) => ({
      clockView: {
        ...state.clockView,
        ...updates,
      },
    })),

  setClockToCurrentHour: () => {
    const currentHourStart = getCurrentHourStart();
    const currentHourEnd = addOneHour(currentHourStart);

    set((state) => ({
      clockView: {
        ...state.clockView,
        clockDate: getTodayInputValue(),
        clockStartTime: currentHourStart,
        clockEndTime: currentHourEnd,
        plannedStartTime: currentHourStart,
        plannedEndTime: currentHourEnd,
      },
    }));
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  loadTasks: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await initializeTaskData();
      const timeBlocks = await loadSavedTimeBlocks();

      set({
        tasks,
        timeBlocks,
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

  loadTimeBlocks: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const timeBlocks = await loadSavedTimeBlocks();

      set({
        timeBlocks,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to load time blocks.",
      });
    }
  },

  resetSampleData: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await resetTasksToSampleData();
      const timeBlocks = await loadSavedTimeBlocks();

      set({
        tasks,
        timeBlocks,
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

  updateSelectedTaskDetails: async (updates) => {
    const selectedTaskId = get().selectedTaskId;

    if (!selectedTaskId) return;

    const cleanTitle = updates.title.trim();

    if (!cleanTitle) {
      set({ errorMessage: "Task title cannot be empty." });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await updateTaskDetails(selectedTaskId, {
        title: cleanTitle,
        description: updates.description.trim(),
        estimatedMinutes: updates.estimatedMinutes,
      });

      set({
        tasks,
        selectedTaskId,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to update task details.",
      });
    }
  },

  deleteSelectedTask: async () => {
    const selectedTaskId = get().selectedTaskId;

    if (!selectedTaskId) return;

    set({ isLoading: true, errorMessage: null });

    try {
      const tasks = await deleteTaskAndChildren(get().tasks, selectedTaskId);
      const timeBlocks = await loadSavedTimeBlocks();

      set({
        tasks,
        timeBlocks,
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

  addPlannedTimeBlock: async (input) => {
    const selectedTaskId = get().selectedTaskId;

    if (!selectedTaskId) {
      set({ errorMessage: "Select a task before adding a time block." });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const timeBlocks = await createPlannedTimeBlock({
        ...input,
        taskId: selectedTaskId,
      });

      set({
        timeBlocks,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage:
          error instanceof Error ? error.message : "Failed to add planned time block.",
      });
    }
  },

  startTrackingSelectedTask: async () => {
    const selectedTaskId = get().selectedTaskId;

    if (!selectedTaskId) {
      set({ errorMessage: "Select a task before starting tracking." });
      return;
    }

    set({ isLoading: true, errorMessage: null });

    try {
      const timeBlocks = await startOrSwitchTrackedTimeBlock(get().timeBlocks, selectedTaskId);
      const currentHourStart = getCurrentHourStart();
      const currentHourEnd = addOneHour(currentHourStart);

      set((state) => ({
        timeBlocks,
        isLoading: false,
        clockView: {
          ...state.clockView,
          activeClockTab: "tracking",
          clockDate: getTodayInputValue(),
          clockStartTime: currentHourStart,
          clockEndTime: currentHourEnd,
        },
      }));
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to start tracking task.",
      });
    }
  },

  stopTrackingCurrentTask: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const timeBlocks = await stopTrackedTimeBlock(get().timeBlocks);

      set({
        timeBlocks,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to stop tracking task.",
      });
    }
  },

  deleteTimeBlock: async (timeBlockId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const timeBlocks = await deleteSavedTimeBlock(timeBlockId);

      set({
        timeBlocks,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({
        isLoading: false,
        errorMessage: "Failed to delete time block.",
      });
    }
  },

  getActiveBlock: () => getActiveTimeBlock(get().timeBlocks),
}));