import type { Task, TaskFilter } from "../types/task";

export type TaskTreeNode = Task & {
  children: TaskTreeNode[];
};

export function findTaskById(tasks: Task[], taskId: string | null): Task | undefined {
  if (!taskId) return undefined;

  return tasks.find((task) => task.id === taskId);
}

export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const taskMap = new Map<string, TaskTreeNode>();

  for (const task of tasks) {
    taskMap.set(task.id, {
      ...task,
      children: [],
    });
  }

  const roots: TaskTreeNode[] = [];

  for (const task of taskMap.values()) {
    if (task.parentId && taskMap.has(task.parentId)) {
      const parent = taskMap.get(task.parentId);
      parent?.children.push(task);
    } else {
      roots.push(task);
    }
  }

  return roots;
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === "all") return tasks;

  if (filter === "open") {
    return tasks.filter((task) => !task.completed);
  }

  return tasks.filter((task) => task.completed);
}