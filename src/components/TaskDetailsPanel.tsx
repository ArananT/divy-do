import { useAppStore } from "../store/useAppStore";
import { findTaskById } from "../utils/taskTree";

export function TaskDetailsPanel() {
  const tasks = useAppStore((state) => state.tasks);
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectedTask = findTaskById(tasks, selectedTaskId);

  if (!selectedTask) {
    return (
      <aside className="details-panel">
        <h2>No task selected</h2>
        <p>Select a task to inspect its details.</p>
      </aside>
    );
  }

  const parent = findTaskById(tasks, selectedTask.parentId);
  const root = findTaskById(tasks, selectedTask.rootId);

  return (
    <aside className="details-panel">
      <div className="details-header">
        <h2>{selectedTask.title}</h2>
        <span className={selectedTask.completed ? "status complete" : "status open"}>
          {selectedTask.completed ? "Complete" : "Open"}
        </span>
      </div>

      <p className="details-description">
        {selectedTask.description || "No description yet."}
      </p>

      <dl className="details-list">
        <div>
          <dt>Parent</dt>
          <dd>{parent?.title || "None"}</dd>
        </div>
        <div>
          <dt>Root task</dt>
          <dd>{root?.title || selectedTask.title}</dd>
        </div>
        <div>
          <dt>Estimate</dt>
          <dd>{selectedTask.estimatedMinutes ? `${selectedTask.estimatedMinutes} minutes` : "Not set"}</dd>
        </div>
        <div>
          <dt>Completion source</dt>
          <dd>{selectedTask.completionSource || "Not completed"}</dd>
        </div>
      </dl>

      <div className="details-actions">
        <button type="button">Edit Task</button>
        <button type="button">Schedule Task</button>
      </div>
    </aside>
  );
}
