import { sampleTasks } from "../data/sampleTasks";
import type { Task, TaskDetailsUpdate } from "../types/task";
import {
  deleteAllTasks,
  deleteTasksByIds,
  initializeDatabase,
  insertTask,
  loadTasksFromDatabase,
  updateTaskCompletion,
  updateTaskDetailsInDatabase,
  updateTaskTitle,
} from "./database";

function createId() {
  return crypto.randomUUID();
}

function getNow() {
  return new Date().toISOString();
}

function getDescendantIds(tasks: Task[], taskId: string): string[] {
  const children = tasks.filter((task) => task.parentId === taskId);
  const descendantIds = children.flatMap((child) => getDescendantIds(tasks, child.id));

  return [taskId, ...children.map((child) => child.id), ...descendantIds];
}

export async function initializeTaskData(): Promise<Task[]> {
  await initializeDatabase();

  let tasks = await loadTasksFromDatabase();

  if (tasks.length === 0) {
    await seedSampleTasks();
    tasks = await loadTasksFromDatabase();
  }

  return tasks;
}

export async function seedSampleTasks() {
  await initializeDatabase();

  for (const task of sampleTasks) {
    await insertTask(task);
  }
}

export async function resetTasksToSampleData(): Promise<Task[]> {
  await initializeDatabase();
  await deleteAllTasks();
  await seedSampleTasks();

  return loadTasksFromDatabase();
}

export async function setTaskCompleted(task: Task, completed: boolean): Promise<Task[]> {
  await updateTaskCompletion(task.id, completed);
  return loadTasksFromDatabase();
}

export async function createRootTask(title: string): Promise<Task[]> {
  await initializeDatabase();

  const now = getNow();
  const taskId = createId();

  const task: Task = {
    id: taskId,
    title,
    description: "",
    parentId: null,
    rootId: taskId,
    completed: false,
    estimatedMinutes: undefined,
    createdAt: now,
    updatedAt: now,
  };

  await insertTask(task);

  return loadTasksFromDatabase();
}

export async function createChildTask(parent: Task, title: string): Promise<Task[]> {
  await initializeDatabase();

  const now = getNow();
  const taskId = createId();

  const task: Task = {
    id: taskId,
    title,
    description: "",
    parentId: parent.id,
    rootId: parent.rootId,
    completed: false,
    estimatedMinutes: undefined,
    createdAt: now,
    updatedAt: now,
  };

  await insertTask(task);

  return loadTasksFromDatabase();
}

export async function renameTask(taskId: string, title: string): Promise<Task[]> {
  await updateTaskTitle(taskId, title);
  return loadTasksFromDatabase();
}

export async function updateTaskDetails(
  taskId: string,
  updates: TaskDetailsUpdate,
): Promise<Task[]> {
  await updateTaskDetailsInDatabase(taskId, updates);
  return loadTasksFromDatabase();
}

export async function deleteTaskAndChildren(tasks: Task[], taskId: string): Promise<Task[]> {
  const idsToDelete = Array.from(new Set(getDescendantIds(tasks, taskId)));

  await deleteTasksByIds(idsToDelete);

  return loadTasksFromDatabase();
}