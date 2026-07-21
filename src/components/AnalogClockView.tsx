import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppStore } from "../store/useAppStore";
import type { TimeBlock } from "../types/task";
import { findTaskById } from "../utils/taskTree";
import { TaskPickerList } from "./TaskPickerList";
import { TaskTreeDiagram } from "./TaskTreeDiagram";

type ClockSegment = {
  block: TimeBlock;
  label: string;
  startAngle: number;
  endAngle: number;
  colorIndex: number;
};

type PlannedInputMode = "endTime" | "duration";

const SEGMENT_COLORS = ["#4a5d23", "#2563eb", "#c2410c", "#7c3aed", "#0891b2", "#be123c"];

function pad(value: number) {
  return String(value).padStart(2, "0");
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

function formatClockInputTime(date: string, time: string) {
  return formatTime(toLocalDateTime(date, time));
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

function getBlockDurationText(block: TimeBlock, nowTick: number) {
  const startMs = new Date(block.startTime).getTime();
  const endMs =
    block.status === "active" || !block.endTime ? nowTick : new Date(block.endTime).getTime();

  return formatDurationFromMs(endMs - startMs);
}

function formatElapsed(startTime: string) {
  const elapsedMs = Date.now() - new Date(startTime).getTime();
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function minutesBetween(start: string, end: string) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDegrees: number) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

function describePieSlice(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const safeEndAngle = Math.min(endAngle, startAngle + 359.99);
  const start = polarToCartesian(centerX, centerY, radius, safeEndAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = safeEndAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function clampBlockToWindow(block: TimeBlock, windowStart: string, windowEnd: string, nowTick: number) {
  const blockStartMs = new Date(block.startTime).getTime();
  const blockEndMs =
    block.status === "active" || !block.endTime ? nowTick : new Date(block.endTime).getTime();
  const windowStartMs = new Date(windowStart).getTime();
  const windowEndMs = new Date(windowEnd).getTime();

  const clampedStartMs = Math.max(blockStartMs, windowStartMs);
  const clampedEndMs = Math.min(blockEndMs, windowEndMs);

  if (clampedEndMs <= clampedStartMs) return null;

  return {
    startTime: new Date(clampedStartMs).toISOString(),
    endTime: new Date(clampedEndMs).toISOString(),
  };
}

function createSegments(
  blocks: TimeBlock[],
  windowStart: string,
  windowEnd: string,
  nowTick: number,
  getTaskTitle: (taskId: string) => string,
): ClockSegment[] {
  const totalWindowMinutes = minutesBetween(windowStart, windowEnd);

  if (totalWindowMinutes <= 0) return [];

  return blocks
    .map((block, index) => {
      const clamped = clampBlockToWindow(block, windowStart, windowEnd, nowTick);

      if (!clamped) return null;

      const blockStartOffset = minutesBetween(windowStart, clamped.startTime);
      const blockEndOffset = minutesBetween(windowStart, clamped.endTime);

      const startAngle = (blockStartOffset / totalWindowMinutes) * 360;
      const endAngle = Math.max(startAngle + 1, (blockEndOffset / totalWindowMinutes) * 360);

      return {
        block,
        label: getTaskTitle(block.taskId),
        startAngle,
        endAngle,
        colorIndex: index % SEGMENT_COLORS.length,
      };
    })
    .filter((segment): segment is ClockSegment => segment !== null);
}

function getClockMarkerLabel(windowStart: string, windowEnd: string, percent: number) {
  const startMs = new Date(windowStart).getTime();
  const endMs = new Date(windowEnd).getTime();
  const markerMs = startMs + (endMs - startMs) * percent;

  return formatTime(new Date(markerMs).toISOString());
}

export function AnalogClockView() {
  const tasks = useAppStore((state) => state.tasks);
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);
  const timeBlocks = useAppStore((state) => state.timeBlocks);
  const clockView = useAppStore((state) => state.clockView);
  const setClockTab = useAppStore((state) => state.setClockTab);
  const setClockViewState = useAppStore((state) => state.setClockViewState);
  const setClockToCurrentHour = useAppStore((state) => state.setClockToCurrentHour);
  const addPlannedTimeBlock = useAppStore((state) => state.addPlannedTimeBlock);
  const startTrackingSelectedTask = useAppStore((state) => state.startTrackingSelectedTask);
  const stopTrackingCurrentTask = useAppStore((state) => state.stopTrackingCurrentTask);
  const deleteTimeBlock = useAppStore((state) => state.deleteTimeBlock);

  const selectedTask = findTaskById(tasks, selectedTaskId);
  const activeBlock = useMemo(
    () => timeBlocks.find((block) => block.status === "active"),
    [timeBlocks],
  );
  const activeTask = findTaskById(tasks, activeBlock?.taskId ?? null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [plannedInputMode, setPlannedInputMode] = useState<PlannedInputMode>("endTime");
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState(10);
  const [nextTaskId, setNextTaskId] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (plannedInputMode === "duration") {
      setPlannedDurationMinutes(selectedTask?.estimatedMinutes ?? 10);
    }
  }, [plannedInputMode, selectedTask?.estimatedMinutes, selectedTaskId]);

  const clockWindowStart = toLocalDateTime(clockView.clockDate, clockView.clockStartTime);
  const clockWindowEnd = toLocalDateTime(clockView.clockDate, clockView.clockEndTime);
  const validClockWindow = new Date(clockWindowEnd).getTime() > new Date(clockWindowStart).getTime();

  const visibleBlocks = useMemo(() => {
    if (!validClockWindow) return [];

    return timeBlocks.filter((block) => {
      const blockDate = getLocalDateKey(block.startTime);
      const sourceMatches =
        clockView.activeClockTab === "planned" ? block.source === "planned" : block.source === "tracked";

      return blockDate === clockView.clockDate && sourceMatches;
    });
  }, [clockView.activeClockTab, clockView.clockDate, timeBlocks, validClockWindow]);

  const segments = useMemo(
    () =>
      createSegments(visibleBlocks, clockWindowStart, clockWindowEnd, nowTick, (taskId) => {
        const task = findTaskById(tasks, taskId);
        return task?.title ?? "Unknown task";
      }),
    [clockWindowEnd, clockWindowStart, nowTick, tasks, visibleBlocks],
  );

  const hoveredSegment = segments.find((segment) => segment.block.id === hoveredSegmentId);
  const hoveredTask = hoveredSegment ? findTaskById(tasks, hoveredSegment.block.taskId) : undefined;

  function handleAddPlannedBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTask) {
      window.alert("Select a task before adding a planned block.");
      return;
    }

    const endTime =
      plannedInputMode === "duration"
        ? addMinutesToTime(clockView.plannedStartTime, plannedDurationMinutes)
        : clockView.plannedEndTime;

    void addPlannedTimeBlock({
      date: clockView.clockDate,
      startTime: clockView.plannedStartTime,
      endTime,
      completeTaskOnFinish: clockView.completeTaskOnFinish,
    });
  }

  function handleSwitchTask() {
    if (!nextTaskId) return;

    selectTask(nextTaskId);
    window.setTimeout(() => {
      void startTrackingSelectedTask();
      setNextTaskId(null);
    }, 0);
  }

  const startMarkerLabel = validClockWindow
    ? getClockMarkerLabel(clockWindowStart, clockWindowEnd, 0)
    : "Start";
  const quarterMarkerLabel = validClockWindow
    ? getClockMarkerLabel(clockWindowStart, clockWindowEnd, 0.25)
    : "Quarter";
  const halfMarkerLabel = validClockWindow
    ? getClockMarkerLabel(clockWindowStart, clockWindowEnd, 0.5)
    : "Half";
  const threeQuarterMarkerLabel = validClockWindow
    ? getClockMarkerLabel(clockWindowStart, clockWindowEnd, 0.75)
    : "Three quarters";

  return (
    <section className="panel analog-workspace">
      <p className="eyebrow">Analog Time Blocking</p>
      <h2>Analog Time-Block View</h2>

      <p className="placeholder-intro">
        This view uses a selected clock window. Time blocks are drawn as pie slices based on how much
        of that window they occupy.
      </p>

      <div className="clock-tabs">
        <button
          className={clockView.activeClockTab === "planned" ? "clock-tab active" : "clock-tab"}
          type="button"
          onClick={() => setClockTab("planned")}
        >
          Planned Blocks
        </button>
        <button
          className={clockView.activeClockTab === "tracking" ? "clock-tab active" : "clock-tab"}
          type="button"
          onClick={() => setClockTab("tracking")}
        >
          Live Tracking
        </button>
      </div>

      <div className="clock-controls">
        <label>
          Date
          <input
            className="light-input"
            type="date"
            value={clockView.clockDate}
            onChange={(event) => setClockViewState({ clockDate: event.target.value })}
          />
        </label>

        <label>
          Clock start
          <input
            className="light-input"
            type="time"
            value={clockView.clockStartTime}
            onChange={(event) => setClockViewState({ clockStartTime: event.target.value })}
          />
        </label>

        <label>
          Clock end
          <input
            className="light-input"
            type="time"
            value={clockView.clockEndTime}
            onChange={(event) => setClockViewState({ clockEndTime: event.target.value })}
          />
        </label>

        <button className="secondary-button" type="button" onClick={setClockToCurrentHour}>
          Set Clock to Current Time
        </button>
      </div>

      {!validClockWindow ? (
        <p className="error-message">Clock end time must be after clock start time.</p>
      ) : null}

      <div className="analog-grid">
        <div className="pie-clock-card">
          <svg className="pie-clock" viewBox="0 0 300 300" role="img" aria-label="Time block clock">
            <circle cx="150" cy="150" r="96" className="pie-clock-background" />

            {segments.map((segment) => (
              <path
                key={segment.block.id}
                d={describePieSlice(150, 150, 96, segment.startAngle, segment.endAngle)}
                fill={SEGMENT_COLORS[segment.colorIndex]}
                className={
                  segment.block.status === "active" || hoveredSegmentId === segment.block.id
                    ? "pie-segment active"
                    : "pie-segment"
                }
                onMouseEnter={() => setHoveredSegmentId(segment.block.id)}
                onMouseLeave={() => setHoveredSegmentId(null)}
                onFocus={() => setHoveredSegmentId(segment.block.id)}
                onBlur={() => setHoveredSegmentId(null)}
                tabIndex={0}
              />
            ))}

            <circle cx="150" cy="150" r="38" className="pie-clock-center" />
            <text x="150" y="144" textAnchor="middle" className="pie-clock-title">
              {formatClockInputTime(clockView.clockDate, clockView.clockStartTime)}
            </text>
            <text x="150" y="162" textAnchor="middle" className="pie-clock-subtitle">
              to {formatClockInputTime(clockView.clockDate, clockView.clockEndTime)}
            </text>

            <text x="150" y="24" textAnchor="middle" className="pie-clock-number">
              {startMarkerLabel}
            </text>
            <text x="280" y="154" textAnchor="middle" className="pie-clock-number">
              {quarterMarkerLabel}
            </text>
            <text x="150" y="292" textAnchor="middle" className="pie-clock-number">
              {halfMarkerLabel}
            </text>
            <text x="20" y="154" textAnchor="middle" className="pie-clock-number">
              {threeQuarterMarkerLabel}
            </text>
          </svg>

          {hoveredSegment && hoveredTask ? (
            <div className="slice-hover-card">
              <span>{hoveredSegment.block.source === "tracked" ? "Tracked block" : "Planned block"}</span>
              <strong>{hoveredTask.title}</strong>
              <p>
                {formatTime(hoveredSegment.block.startTime)} - {formatTime(hoveredSegment.block.endTime)}
              </p>
              <p>Duration: {getBlockDurationText(hoveredSegment.block, nowTick)}</p>
              {hoveredTask.description ? <p>{hoveredTask.description}</p> : null}
            </div>
          ) : (
            <div className="slice-hover-card">
              <span>Slice details</span>
              <strong>Hover over a slice</strong>
              <p>Task name, time range, duration, and description will appear here.</p>
            </div>
          )}

          <div className="segment-legend">
            {segments.length === 0 ? (
              <p>No blocks overlap this clock window yet.</p>
            ) : (
              segments.map((segment) => (
                <div key={segment.block.id} className="segment-legend-row">
                  <span
                    className="legend-color"
                    style={{ background: SEGMENT_COLORS[segment.colorIndex] }}
                  />
                  <div>
                    <strong>{segment.label}</strong>
                    <small>
                      {formatTime(segment.block.startTime)} - {formatTime(segment.block.endTime)} •{" "}
                      {getBlockDurationText(segment.block, nowTick)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="clock-side-panel">
          {clockView.activeClockTab === "planned" ? (
            <section className="clock-mode-panel">
              <h3>Add Planned Block</h3>
              <p>Select a task, then choose where it belongs inside the current clock window.</p>

              <TaskPickerList selectedTaskId={selectedTaskId} onSelectTask={selectTask} />

              <form onSubmit={handleAddPlannedBlock}>
                <div className="mode-toggle-row">
                  <button
                    className={plannedInputMode === "endTime" ? "active" : ""}
                    type="button"
                    onClick={() => setPlannedInputMode("endTime")}
                  >
                    End time
                  </button>
                  <button
                    className={plannedInputMode === "duration" ? "active" : ""}
                    type="button"
                    onClick={() => setPlannedInputMode("duration")}
                  >
                    Duration
                  </button>
                </div>

                <div className="day-time-compact-row">
                  <label htmlFor="planned-start">
                    Start
                    <input
                      id="planned-start"
                      className="details-input"
                      type="time"
                      value={clockView.plannedStartTime}
                      onChange={(event) => setClockViewState({ plannedStartTime: event.target.value })}
                    />
                  </label>

                  {plannedInputMode === "endTime" ? (
                    <label htmlFor="planned-end">
                      End
                      <input
                        id="planned-end"
                        className="details-input"
                        type="time"
                        value={clockView.plannedEndTime}
                        onChange={(event) => setClockViewState({ plannedEndTime: event.target.value })}
                      />
                    </label>
                  ) : (
                    <label htmlFor="planned-duration">
                      Minutes
                      <input
                        id="planned-duration"
                        className="details-input"
                        type="number"
                        min="1"
                        value={plannedDurationMinutes}
                        onChange={(event) => setPlannedDurationMinutes(Number(event.target.value))}
                      />
                    </label>
                  )}
                </div>

                <label className="checkbox-label dark-checkbox-label">
                  <input
                    type="checkbox"
                    checked={clockView.completeTaskOnFinish}
                    onChange={(event) =>
                      setClockViewState({ completeTaskOnFinish: event.target.checked })
                    }
                  />
                  Mark complete when finished
                </label>

                <button className="save-details-button" type="submit">
                  Add Planned Block
                </button>
              </form>
            </section>
          ) : (
            <section className="clock-mode-panel">
              <h3>Live Tracking</h3>
              <p>Select a task and start tracking it. After tracking starts, use Next task to switch.</p>

              {!activeBlock ? (
                <>
                  <TaskPickerList selectedTaskId={selectedTaskId} onSelectTask={selectTask} />

                  <div className="tracking-actions">
                    <button
                      type="button"
                      disabled={!selectedTask}
                      onClick={() => void startTrackingSelectedTask()}
                    >
                      Start tracking
                    </button>

                    <button type="button" disabled>
                      Stop tracking
                    </button>
                  </div>
                </>
              ) : null}

              {activeBlock && activeTask ? (
                <>
                  <div className="active-tracking-card">
                    <span>Currently tracking</span>
                    <strong>{activeTask.title}</strong>
                    <small>Started: {formatTime(activeBlock.startTime)}</small>
                    <div className="elapsed-time">{formatElapsed(activeBlock.startTime)}</div>
                  </div>

                  <div className="tracking-actions">
                    <button type="button" disabled>
                      Start tracking
                    </button>

                    <button type="button" onClick={() => void stopTrackingCurrentTask()}>
                      Stop tracking
                    </button>
                  </div>

                  <div className="next-task-panel">
                    <label className="field-label">Next task</label>
                    <TaskPickerList selectedTaskId={nextTaskId} onSelectTask={setNextTaskId} />
                    <button type="button" disabled={!nextTaskId} onClick={handleSwitchTask}>
                      Switch task
                    </button>
                  </div>
                </>
              ) : null}
            </section>
          )}
        </div>
      </div>

      <TaskTreeDiagram
        compact
        title="Task Tree Reference"
        description="This visual tree shows the task hierarchy used by planned blocks and live tracking."
      />

      <section className="placeholder-card">
        <h3>{clockView.activeClockTab === "planned" ? "Planned Blocks" : "Tracked Blocks"} in This Window</h3>

        {visibleBlocks.length === 0 ? (
          <p>No blocks for this tab and clock window yet.</p>
        ) : (
          <div className="time-block-list">
            {visibleBlocks.map((block) => {
              const task = findTaskById(tasks, block.taskId);
              const overlapsWindow =
                segments.find((segment) => segment.block.id === block.id) !== undefined;

              return (
                <article key={block.id} className="time-block-card">
                  <div>
                    <strong>{task?.title ?? "Unknown task"}</strong>
                    <span>
                      {block.source === "tracked" ? "Tracked" : "Planned"} •{" "}
                      {block.status === "active" ? "Active" : "Complete"}
                    </span>
                  </div>

                  <p>
                    {formatTime(block.startTime)} - {formatTime(block.endTime)} •{" "}
                    {getBlockDurationText(block, nowTick)}
                  </p>

                  {!overlapsWindow ? (
                    <small>This block is on the selected date but outside the clock window.</small>
                  ) : null}

                  <button type="button" onClick={() => void deleteTimeBlock(block.id)}>
                    Delete Block
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}