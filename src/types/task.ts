export type CompletionSource = "manual" | "time_block" | "parent";

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

export type TimeBlock = {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  completeTaskOnFinish: boolean;
};

export type AppView = "tasks" | "clock" | "day" | "research";
