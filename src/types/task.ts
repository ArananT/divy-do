export type CompletionSource = "manual" | "time_block" | "parent";

export type AppView = "tasks" | "clock" | "day";

export type TaskFilter = "all" | "open" | "completed";

export type TimeBlockSource = "planned" | "tracked";

export type TimeBlockStatus = "active" | "complete";

export type ClockTab = "planned" | "tracking";

export type Task = {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  rootId: string;
  completed: boolean;
  completionSource?: CompletionSource;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskDetailsUpdate = {
  title: string;
  description: string;
  estimatedMinutes?: number;
};

export type TimeBlock = {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  completeTaskOnFinish: boolean;
  source: TimeBlockSource;
  status: TimeBlockStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlannedTimeBlockInput = {
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  completeTaskOnFinish: boolean;
};

export type ClockViewState = {
  activeClockTab: ClockTab;
  clockDate: string;
  clockStartTime: string;
  clockEndTime: string;
  plannedStartTime: string;
  plannedEndTime: string;
  completeTaskOnFinish: boolean;
};