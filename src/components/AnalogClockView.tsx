import { useAppStore } from "../store/useAppStore";
import { findTaskById } from "../utils/taskTree";

const hours = Array.from({ length: 12 }, (_, index) => index + 1);

export function AnalogClockView() {
  const tasks = useAppStore((state) => state.tasks);
  const timeBlocks = useAppStore((state) => state.timeBlocks);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Analog Clock View</h2>
          <p>Placeholder for assigning tasks to visual intervals on a 12-hour clock face.</p>
        </div>
      </div>

      <div className="clock-layout">
        <div className="clock-face">
          {hours.map((hour) => {
            const angle = hour * 30;
            return (
              <span
                key={hour}
                className="clock-number"
                style={{ transform: `rotate(${angle}deg) translateY(-8.4rem) rotate(-${angle}deg)` }}
              >
                {hour}
              </span>
            );
          })}
          <div className="clock-center">Plan</div>
          <div className="clock-block morning">9:00-10:30</div>
          <div className="clock-block afternoon">1:00-2:30</div>
        </div>

        <div className="scheduled-list">
          <h3>Scheduled blocks</h3>
          {timeBlocks.map((block) => {
            const task = findTaskById(tasks, block.taskId);
            return (
              <article key={block.id} className="scheduled-card">
                <strong>{task?.title || "Unknown task"}</strong>
                <span>{block.durationMinutes} minutes</span>
                <small>Complete task on finish: {block.completeTaskOnFinish ? "yes" : "no"}</small>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
