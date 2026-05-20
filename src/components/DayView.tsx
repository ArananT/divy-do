import { useAppStore } from "../store/useAppStore";
import { findTaskById } from "../utils/taskTree";

const hours = Array.from({ length: 14 }, (_, index) => index + 7);

export function DayView() {
  const tasks = useAppStore((state) => state.tasks);
  const timeBlocks = useAppStore((state) => state.timeBlocks);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Vertical Day View</h2>
          <p>Placeholder for a conventional daily timeline using the same time-block data.</p>
        </div>
      </div>

      <div className="day-grid">
        {hours.map((hour) => (
          <div key={hour} className="day-row">
            <span className="day-time">{hour}:00</span>
            <div className="day-slot">
              {timeBlocks.map((block) => {
                const blockHour = new Date(block.startTime).getHours();
                if (blockHour !== hour) return null;

                const task = findTaskById(tasks, block.taskId);

                return (
                  <div key={block.id} className="day-block">
                    <strong>{task?.title || "Unknown task"}</strong>
                    <small>{block.durationMinutes} min</small>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
