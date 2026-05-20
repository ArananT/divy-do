import type { Task } from "../types/task";

export type TaskTreeNode = Task & {
  children: TaskTreeNode[];
};

export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const nodeMap = new Map<string, TaskTreeNode>();

  tasks.forEach((task) => {
    nodeMap.set(task.id, { ...task, children: [] });
  });

  const roots: TaskTreeNode[] = [];

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node);
      return;
    }

    const parent = nodeMap.get(node.parentId);

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function findTaskById(tasks: Task[], taskId: string | null): Task | undefined {
  if (!taskId) return undefined;
  return tasks.find((task) => task.id === taskId);
}
