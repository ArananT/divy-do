import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppStore } from "../store/useAppStore";
import type { TimeBlock, TimeBlockSource } from "../types/task";
import { findTaskById } from "../utils/taskTree";
import { TaskPickerList } from "./TaskPickerList";

type DayFilter = "all" | TimeBlockSource;
type NewBlockMode = "endTime" | "duration";

type PositionedBlock = {
  block: TimeBlock;
  topPercent: number;
  heightPercent: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getTodayDate() {
  const now = new Date();

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function toLocalDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getLocalDateKey(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeAmPm(value: string) {
  return value.replace(/\./g, "").toLowerCase();
}

function formatTime(value?: string) {
  if (!value) return "Active";

  return normalizeAmPm(
    new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );
}

function formatDurationFromMs(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min ${seconds} sec`;
  }

  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }

  return `${seconds} sec`;
}

function getBlockEndMs(block: TimeBlock, nowTick: number) {
  if (block.status === "active" || !block.endTime) {
    return nowTick;
  }

  return new Date(block.endTime).getTime();
}

function getBlockDurationText(block: TimeBlock, nowTick: number) {
  const startMs = new Date(block.startTime).getTime();
  const endMs = getBlockEndMs(block, nowTick);

  return formatDurationFromMs(endMs - startMs);
}

function getHourRows(dayStart: string, dayEnd: string) {
  const rows: string[] = [];
  const start = new Date(dayStart);
  const end = new Date(dayEnd);
  const cursor = new Date(start);

  cursor.setMinutes(0, 0, 0);

  if (cursor.getTime() < start.getTime()) {
    cursor.setHours(cursor.getHours() + 1);
  }

  while (cursor.getTime() <= end.getTime()) {
    rows.push(cursor.toISOString());
    cursor.setHours(cursor.getHours() + 1);
  }

  return rows;
}

function positionBlocks(
  blocks: TimeBlock[],
  dayStart: string,
  dayEnd: string,
  nowTick: number,
): PositionedBlock[] {
  const dayStartMs = new Date(dayStart).getTime();
  const dayEndMs = new Date(dayEnd).getTime();
  const dayDurationMs = dayEndMs - dayStartMs;

  if (dayDurationMs <= 0) return [];

  return blocks
    .map((block) => {
      const blockStartMs = new Date(block.startTime).getTime();
      const blockEndMs = getBlockEndMs(block, nowTick);

      const clampedStartMs = Math.max(blockStartMs, dayStartMs);
      const clampedEndMs = Math.min(blockEndMs, dayEndMs);

      if (clampedEndMs <= clampedStartMs) return null;

      const topPercent = ((clampedStartMs - dayStartMs) / dayDurationMs) * 100;
      const heightPercent = Math.max(((clampedEndMs - clampedStartMs) / dayDurationMs) * 100, 2.2);

      return {
        block,
        topPercent,
        heightPercent,
      };
    })
    .filter((item): item is PositionedBlock => item !== null);
}

export function DayView() {
  const tasks = useAppStore((state) => state.tasks);
  const timeBlocks = useAppStore((state) => state.timeBlocks);
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);
  const addPlannedTimeBlock = useAppStore((state) => state.addPlannedTimeBlock);

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dayStartTime, setDayStartTime] = useState("06:00");
  const [dayEndTime, setDayEndTime] = useState("22:00");
  const [filter, setFilter] = useState<DayFilter>("all");
  const [newBlockStartTime, setNewBlockStartTime] = useState("09:00");
  const [newBlockEndTime, setNewBlockEndTime] = useState("10:00");
  const [newBlockMode, setNewBlockMode] = useState<NewBlockMode>("endTime");
  const [newBlockDurationMinutes, setNewBlockDurationMinutes] = useState(10);
  const [completeTaskOnFinish, setCompleteTaskOnFinish] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const selectedTask = findTaskById(tasks, selectedTaskId);

  useEffect(() => {
    if (newBlockMode === "duration") {
      setNewBlockDurationMinutes(selectedTask?.estimatedMinutes ?? 10);
    }
  }, [newBlockMode, selectedTask?.estimatedMinutes, selectedTaskId]);

  const dayStart = toLocalDateTime(selectedDate, dayStartTime);
  const dayEnd = toLocalDateTime(selectedDate, dayEndTime);
  const validDayWindow = new Date(dayEnd).getTime() > new Date(dayStart).getTime();

  const dayBlocks = useMemo(() => {
    if (!validDayWindow) return [];

    return timeBlocks.filter((block) => {
      const blockDateMatches = getLocalDateKey(block.startTime) === selectedDate;
      const filterMatches = filter === "all" || block.source === filter;

      return blockDateMatches && filterMatches;
    });
  }, [filter, selectedDate, timeBlocks, validDayWindow]);

  const positionedBlocks = useMemo(
    () => positionBlocks(dayBlocks, dayStart, dayEnd, nowTick),
    [dayBlocks, dayEnd, dayStart, nowTick],
  );

  const hourRows = useMemo(() => getHourRows(dayStart, dayEnd), [dayEnd, dayStart]);
  const detailBlockId = hoveredBlockId ?? selectedBlockId;
  const detailBlock = detailBlockId ? timeBlocks.find((block) => block.id === detailBlockId) : undefined;
  const detailTask = detailBlock ? findTaskById(tasks, detailBlock.taskId) : undefined;

  function handleAddBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTask) {
      window.alert("Select a task before adding a block.");
      return;
    }

    const endTime =
      newBlockMode === "duration"
        ? addMinutesToTime(newBlockStartTime, newBlockDurationMinutes)
        : newBlockEndTime;

    void addPlannedTimeBlock({
      date: selectedDate,
      startTime: newBlockStartTime,
      endTime,
      completeTaskOnFinish,
    });
  }

  return (
    <section className="panel day-view-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Vertical Day View</p>
          <h1>Daily Schedule</h1>
          <p>
            This view shows planned and tracked time blocks in a vertical schedule layout. Planned
            blocks can also be added directly from this page.
          </p>
        </div>
      </div>

      <div className="day-controls">
        <label>
          Date
          <input
            className="light-input"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <label>
          Day start
          <input
            className="light-input"
            type="time"
            value={dayStartTime}
            onChange={(event) => setDayStartTime(event.target.value)}
          />
        </label>

        <label>
          Day end
          <input
            className="light-input"
            type="time"
            value={dayEndTime}
            onChange={(event) => setDayEndTime(event.target.value)}
          />
        </label>

        <label>
          Show
          <select
            className="light-input"
            value={filter}
            onChange={(event) => setFilter(event.target.value as DayFilter)}
          >
            <option value="all">All blocks</option>
            <option value="planned">Planned only</option>
            <option value="tracked">Tracked only</option>
          </select>
        </label>
      </div>

      {!validDayWindow ? (
        <p className="error-message">Day end time must be after day start time.</p>
      ) : null}

      <div className="day-summary-grid">
        <article className="day-summary-card">
          <span>Total blocks</span>
          <strong>{dayBlocks.length}</strong>
        </article>

        <article className="day-summary-card">
          <span>Planned</span>
          <strong>{dayBlocks.filter((block) => block.source === "planned").length}</strong>
        </article>

        <article className="day-summary-card">
          <span>Tracked</span>
          <strong>{dayBlocks.filter((block) => block.source === "tracked").length}</strong>
        </article>

        <article className="day-summary-card">
          <span>Active</span>
          <strong>{dayBlocks.some((block) => block.status === "active") ? "Yes" : "No"}</strong>
        </article>
      </div>

      <div className="day-workspace-grid">
        <form className="day-add-block-card" onSubmit={handleAddBlock}>
          <div className="day-add-block-header">
            <div>
              <p className="eyebrow">Add Block</p>
              <h3>Plan from Day View</h3>
            </div>
            <span>{selectedTask?.title ?? "No task selected"}</span>
          </div>

          <TaskPickerList selectedTaskId={selectedTaskId} onSelectTask={selectTask} />

          <div className="mode-toggle-row">
            <button
              className={newBlockMode === "endTime" ? "active" : ""}
              type="button"
              onClick={() => setNewBlockMode("endTime")}
            >
              End time
            </button>
            <button
              className={newBlockMode === "duration" ? "active" : ""}
              type="button"
              onClick={() => setNewBlockMode("duration")}
            >
              Duration
            </button>
          </div>

          <div className="day-time-compact-row">
            <label htmlFor="day-block-start">
              Start
              <input
                id="day-block-start"
                className="details-input"
                type="time"
                value={newBlockStartTime}
                onChange={(event) => setNewBlockStartTime(event.target.value)}
              />
            </label>

            {newBlockMode === "endTime" ? (
              <label htmlFor="day-block-end">
                End
                <input
                  id="day-block-end"
                  className="details-input"
                  type="time"
                  value={newBlockEndTime}
                  onChange={(event) => setNewBlockEndTime(event.target.value)}
                />
              </label>
            ) : (
              <label htmlFor="day-block-duration">
                Minutes
                <input
                  id="day-block-duration"
                  className="details-input"
                  type="number"
                  min="1"
                  value={newBlockDurationMinutes}
                  onChange={(event) => setNewBlockDurationMinutes(Number(event.target.value))}
                />
              </label>
            )}
          </div>

          <label className="checkbox-label day-compact-checkbox">
            <input
              type="checkbox"
              checked={completeTaskOnFinish}
              onChange={(event) => setCompleteTaskOnFinish(event.target.checked)}
            />
            Mark complete when finished
          </label>

          <button className="save-details-button" type="submit">
            Add Planned Block
          </button>
        </form>
      </div>

      <div className="day-view-area">
        <div className="day-timeline-card">
          <div className="day-timeline-scroll">
            <div className="day-timeline">
              {hourRows.map((row) => {
                const rowMs = new Date(row).getTime();
                const startMs = new Date(dayStart).getTime();
                const endMs = new Date(dayEnd).getTime();
                const topPercent = ((rowMs - startMs) / (endMs - startMs)) * 100;

                return (
                  <div key={row} className="day-hour-row" style={{ top: `${topPercent}%` }}>
                    <span>{formatTime(row)}</span>
                    <div />
                  </div>
                );
              })}

              {positionedBlocks.map(({ block, topPercent, heightPercent }) => {
                const task = findTaskById(tasks, block.taskId);
                const isHovered = hoveredBlockId === block.id;
                const isSelected = selectedBlockId === block.id;

                return (
                  <button
                    key={block.id}
                    type="button"
                    className={[
                      "day-time-block",
                      block.source,
                      block.status === "active" ? "active" : "",
                      isHovered || isSelected ? "hovered" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    onClick={() => {
                      selectTask(block.taskId);
                      setSelectedBlockId(block.id);
                    }}
                    onMouseEnter={() => setHoveredBlockId(block.id)}
                    onMouseLeave={() => setHoveredBlockId(null)}
                    onFocus={() => setHoveredBlockId(block.id)}
                    onBlur={() => setHoveredBlockId(null)}
                  >
                    <strong>{task?.title ?? "Unknown task"}</strong>
                    <span>
                      {formatTime(block.startTime)} - {formatTime(block.endTime)}
                    </span>
                  </button>
                );
              })}

              {positionedBlocks.length === 0 ? (
                <div className="day-empty-message">
                  <strong>No blocks on this date</strong>
                  <p>Add a planned block from this page or use live tracking from the analog view.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="day-details-card">
          {detailBlock && detailTask ? (
            <>
              <span>{detailBlock.source === "planned" ? "Planned block" : "Tracked block"}</span>
              <h3>{detailTask.title}</h3>
              <p>
                {formatTime(detailBlock.startTime)} - {formatTime(detailBlock.endTime)}
              </p>
              <p>Duration: {getBlockDurationText(detailBlock, nowTick)}</p>
              <p>Status: {detailBlock.status === "active" ? "Active" : "Complete"}</p>
              {detailTask.description ? <p>{detailTask.description}</p> : null}
            </>
          ) : (
            <>
              <span>Block details</span>
              <h3>Hover over or click a block</h3>
              <p>Task name, time range, duration, status, and description will appear here.</p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}