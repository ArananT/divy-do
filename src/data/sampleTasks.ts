import type { Task, TimeBlock } from "../types/task";

const now = new Date().toISOString();

export const sampleTasks: Task[] = [
  {
    id: "task-1",
    title: "Honours Project",
    description: "Root project for the task organization and time-blocking application.",
    parentId: null,
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 6000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-2",
    title: "Set up project environment",
    description: "Create the starter app, folder structure, and local development workflow.",
    parentId: "task-1",
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 120,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-3",
    title: "Research existing task management patterns",
    parentId: "task-1",
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 180,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-4",
    title: "Create wireframes",
    parentId: "task-1",
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 180,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-5",
    title: "Analog clock view sketch",
    parentId: "task-4",
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 60,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-6",
    title: "Vertical day view sketch",
    parentId: "task-4",
    rootId: "task-1",
    completed: false,
    estimatedMinutes: 60,
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleTimeBlocks: TimeBlock[] = [
  {
    id: "block-1",
    taskId: "task-2",
    startTime: "2026-05-20T09:00:00",
    endTime: "2026-05-20T10:30:00",
    durationMinutes: 90,
    completeTaskOnFinish: false,
  },
  {
    id: "block-2",
    taskId: "task-4",
    startTime: "2026-05-20T13:00:00",
    endTime: "2026-05-20T14:30:00",
    durationMinutes: 90,
    completeTaskOnFinish: false,
  },
];
