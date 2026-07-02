import type { PlannedTimeBlockInput, TimeBlock } from "../types/task";
import {
  completeTimeBlockInDatabase,
  deleteTimeBlockFromDatabase,
  insertTimeBlock,
  loadTimeBlocksFromDatabase,
} from "./database";

function createId() {
  return crypto.randomUUID();
}

function getNow() {
  return new Date().toISOString();
}

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function calculateDurationMinutes(startTime: string, endTime: string) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return Math.max(0, Math.round((end - start) / 60000));
}

export function getActiveTimeBlock(timeBlocks: TimeBlock[]) {
  return timeBlocks.find((block) => block.status === "active");
}

export async function loadSavedTimeBlocks(): Promise<TimeBlock[]> {
  return loadTimeBlocksFromDatabase();
}

export async function createPlannedTimeBlock(input: PlannedTimeBlockInput): Promise<TimeBlock[]> {
  const startDateTime = toDateTime(input.date, input.startTime);
  const endDateTime = toDateTime(input.date, input.endTime);
  const durationMinutes = calculateDurationMinutes(startDateTime, endDateTime);

  if (durationMinutes <= 0) {
    throw new Error("End time must be after start time.");
  }

  const now = getNow();

  const timeBlock: TimeBlock = {
    id: createId(),
    taskId: input.taskId,
    startTime: startDateTime,
    endTime: endDateTime,
    durationMinutes,
    completeTaskOnFinish: input.completeTaskOnFinish,
    source: "planned",
    status: "complete",
    createdAt: now,
    updatedAt: now,
  };

  await insertTimeBlock(timeBlock);

  return loadTimeBlocksFromDatabase();
}

export async function startOrSwitchTrackedTimeBlock(
  timeBlocks: TimeBlock[],
  taskId: string,
): Promise<TimeBlock[]> {
  const activeBlock = getActiveTimeBlock(timeBlocks);
  const now = getNow();

  if (activeBlock?.taskId === taskId) {
    return timeBlocks;
  }

  if (activeBlock) {
    await completeTimeBlockInDatabase(
      activeBlock.id,
      now,
      calculateDurationMinutes(activeBlock.startTime, now),
    );
  }

  const newBlock: TimeBlock = {
    id: createId(),
    taskId,
    startTime: now,
    endTime: undefined,
    durationMinutes: undefined,
    completeTaskOnFinish: false,
    source: "tracked",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await insertTimeBlock(newBlock);

  return loadTimeBlocksFromDatabase();
}

export async function stopTrackedTimeBlock(timeBlocks: TimeBlock[]): Promise<TimeBlock[]> {
  const activeBlock = getActiveTimeBlock(timeBlocks);

  if (!activeBlock) {
    return timeBlocks;
  }

  const now = getNow();

  await completeTimeBlockInDatabase(
    activeBlock.id,
    now,
    calculateDurationMinutes(activeBlock.startTime, now),
  );

  return loadTimeBlocksFromDatabase();
}

export async function deleteSavedTimeBlock(timeBlockId: string): Promise<TimeBlock[]> {
  await deleteTimeBlockFromDatabase(timeBlockId);

  return loadTimeBlocksFromDatabase();
}