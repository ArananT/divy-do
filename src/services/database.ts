import Database from "@tauri-apps/plugin-sql";
import type { Task, TaskDetailsUpdate, TimeBlock } from "../types/task";

const DATABASE_URL = "sqlite:divy-do.db";

let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

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

type TimeBlockRow = {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  complete_task_on_finish: number;
  source: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type TableColumn = {
  name: string;
  notnull: number;
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

function rowToTimeBlock(row: TimeBlockRow): TimeBlock {
  return {
    id: row.id,
    taskId: row.task_id,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    completeTaskOnFinish: row.complete_task_on_finish === 1,
    source: row.source === "tracked" ? "tracked" : "planned",
    status: row.status === "active" ? "active" : "complete",
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

async function createTimeBlocksTable() {
  const db = await getDatabase();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_blocks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER,
      complete_task_on_finish INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'planned',
      status TEXT NOT NULL DEFAULT 'complete',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function ensureTimeBlockSchema() {
  const db = await getDatabase();

  await createTimeBlocksTable();

  let columns = await db.select<TableColumn[]>("PRAGMA table_info(time_blocks);");
  let columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("source")) {
    await db.execute("ALTER TABLE time_blocks ADD COLUMN source TEXT NOT NULL DEFAULT 'planned';");
  }

  if (!columnNames.has("status")) {
    await db.execute("ALTER TABLE time_blocks ADD COLUMN status TEXT NOT NULL DEFAULT 'complete';");
  }

  columns = await db.select<TableColumn[]>("PRAGMA table_info(time_blocks);");
  columnNames = new Set(columns.map((column) => column.name));

  const endTimeColumn = columns.find((column) => column.name === "end_time");
  const durationColumn = columns.find((column) => column.name === "duration_minutes");

  const needsRebuild =
    endTimeColumn?.notnull === 1 ||
    durationColumn?.notnull === 1 ||
    !columnNames.has("source") ||
    !columnNames.has("status");

  if (!needsRebuild) return;

  await db.execute("ALTER TABLE time_blocks RENAME TO time_blocks_old;");

  await db.execute(`
    CREATE TABLE time_blocks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER,
      complete_task_on_finish INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'planned',
      status TEXT NOT NULL DEFAULT 'complete',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    INSERT INTO time_blocks (
      id,
      task_id,
      start_time,
      end_time,
      duration_minutes,
      complete_task_on_finish,
      source,
      status,
      created_at,
      updated_at
    )
    SELECT
      id,
      task_id,
      start_time,
      end_time,
      duration_minutes,
      complete_task_on_finish,
      COALESCE(source, 'planned'),
      COALESCE(status, 'complete'),
      created_at,
      updated_at
    FROM time_blocks_old;
  `);

  await db.execute("DROP TABLE time_blocks_old;");
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

  await ensureTimeBlockSchema();
}

export async function loadTasksFromDatabase(): Promise<Task[]> {
  await initializeDatabase();

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
  await initializeDatabase();

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
  await initializeDatabase();

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
  await initializeDatabase();

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

export async function updateTaskDetailsInDatabase(
  taskId: string,
  updates: TaskDetailsUpdate,
) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
    UPDATE tasks
    SET title = ?, description = ?, estimated_minutes = ?, updated_at = ?
    WHERE id = ?;
    `,
    [
      updates.title,
      updates.description,
      updates.estimatedMinutes ?? null,
      new Date().toISOString(),
      taskId,
    ],
  );
}

export async function deleteTasksByIds(taskIds: string[]) {
  if (taskIds.length === 0) return;

  await initializeDatabase();

  const db = await getDatabase();

  for (const taskId of taskIds) {
    await db.execute("DELETE FROM time_blocks WHERE task_id = ?;", [taskId]);
  }

  for (const taskId of taskIds) {
    await db.execute("DELETE FROM tasks WHERE id = ?;", [taskId]);
  }
}

export async function deleteAllTasks() {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute("DELETE FROM time_blocks;");
  await db.execute("DELETE FROM tasks;");
}

export async function loadTimeBlocksFromDatabase(): Promise<TimeBlock[]> {
  await initializeDatabase();

  const db = await getDatabase();

  const rows = await db.select<TimeBlockRow[]>(`
    SELECT
      id,
      task_id,
      start_time,
      end_time,
      duration_minutes,
      complete_task_on_finish,
      source,
      status,
      created_at,
      updated_at
    FROM time_blocks
    ORDER BY start_time ASC;
  `);

  return rows.map(rowToTimeBlock);
}

export async function insertTimeBlock(timeBlock: TimeBlock) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
    INSERT INTO time_blocks (
      id,
      task_id,
      start_time,
      end_time,
      duration_minutes,
      complete_task_on_finish,
      source,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      timeBlock.id,
      timeBlock.taskId,
      timeBlock.startTime,
      timeBlock.endTime ?? null,
      timeBlock.durationMinutes ?? null,
      timeBlock.completeTaskOnFinish ? 1 : 0,
      timeBlock.source,
      timeBlock.status,
      timeBlock.createdAt,
      timeBlock.updatedAt,
    ],
  );
}

export async function completeTimeBlockInDatabase(
  timeBlockId: string,
  endTime: string,
  durationMinutes: number,
) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
    UPDATE time_blocks
    SET end_time = ?, duration_minutes = ?, status = 'complete', updated_at = ?
    WHERE id = ?;
    `,
    [endTime, durationMinutes, new Date().toISOString(), timeBlockId],
  );
}

export async function deleteTimeBlockFromDatabase(timeBlockId: string) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute("DELETE FROM time_blocks WHERE id = ?;", [timeBlockId]);
}