import Database from "@tauri-apps/plugin-sql";
import type { Task } from "../types/task";

const DATABASE_URL = "sqlite:divy-do.db";

let dbInstance: Database | null = null;

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  root_id: string;
  completed: number;
  completion_source: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    parentId: row.parent_id,
    rootId: row.root_id,
    completed: row.completed === 1,
    completionSource:
      row.completion_source === "manual" ||
      row.completion_source === "time_block" ||
      row.completion_source === "parent"
        ? row.completion_source
        : undefined,
    estimatedMinutes: row.estimated_minutes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await Database.load(DATABASE_URL);
  }

  return dbInstance;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      root_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completion_source TEXT,
      estimated_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_blocks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      complete_task_on_finish INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function loadTasksFromDatabase(): Promise<Task[]> {
  const db = await getDatabase();

  const rows = await db.select<TaskRow[]>(`
    SELECT
      id,
      title,
      description,
      parent_id,
      root_id,
      completed,
      completion_source,
      estimated_minutes,
      created_at,
      updated_at
    FROM tasks
    ORDER BY created_at ASC;
  `);

  return rows.map(rowToTask);
}

export async function insertTask(task: Task) {
  const db = await getDatabase();

  await db.execute(
    `
    INSERT INTO tasks (
      id,
      title,
      description,
      parent_id,
      root_id,
      completed,
      completion_source,
      estimated_minutes,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      task.id,
      task.title,
      task.description ?? null,
      task.parentId,
      task.rootId,
      task.completed ? 1 : 0,
      task.completionSource ?? null,
      task.estimatedMinutes ?? null,
      task.createdAt,
      task.updatedAt,
    ],
  );
}

export async function updateTaskCompletion(taskId: string, completed: boolean) {
  const db = await getDatabase();

  await db.execute(
    `
    UPDATE tasks
    SET completed = ?, completion_source = ?, updated_at = ?
    WHERE id = ?;
    `,
    [completed ? 1 : 0, completed ? "manual" : null, new Date().toISOString(), taskId],
  );
}

export async function updateTaskTitle(taskId: string, title: string) {
  const db = await getDatabase();

  await db.execute(
    `
    UPDATE tasks
    SET title = ?, updated_at = ?
    WHERE id = ?;
    `,
    [title, new Date().toISOString(), taskId],
  );
}

export async function deleteTasksByIds(taskIds: string[]) {
  if (taskIds.length === 0) return;

  const db = await getDatabase();

  for (const taskId of taskIds) {
    await db.execute("DELETE FROM time_blocks WHERE task_id = ?;", [taskId]);
  }

  for (const taskId of taskIds) {
    await db.execute("DELETE FROM tasks WHERE id = ?;", [taskId]);
  }
}

export async function deleteAllTasks() {
  const db = await getDatabase();

  await db.execute("DELETE FROM time_blocks;");
  await db.execute("DELETE FROM tasks;");
}