import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { findTaskById } from "../utils/taskTree";

export function TaskDetailsPanel() {
  const tasks = useAppStore((state) => state.tasks);
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const addChildTask = useAppStore((state) => state.addChildTask);
  const updateSelectedTaskDetails = useAppStore((state) => state.updateSelectedTaskDetails);
  const deleteSelectedTask = useAppStore((state) => state.deleteSelectedTask);
  const toggleTaskComplete = useAppStore((state) => state.toggleTaskComplete);
  const selectedTask = findTaskById(tasks, selectedTaskId);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftEstimate, setDraftEstimate] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
    if (!selectedTask) {
      setDraftTitle("");
      setDraftDescription("");
      setDraftEstimate("");
      setNewSubtaskTitle("");
      return;
    }

    setDraftTitle(selectedTask.title);
    setDraftDescription(selectedTask.description ?? "");
    setDraftEstimate(
      selectedTask.estimatedMinutes !== undefined ? String(selectedTask.estimatedMinutes) : "",
    );
    setNewSubtaskTitle("");
  }, [selectedTask]);

  if (!selectedTask) {
    return (
      <aside className="details-panel">
        <h2>No task selected</h2>
        <p>Select a task to inspect and edit its details.</p>
      </aside>
    );
  }

  const parent = findTaskById(tasks, selectedTask.parentId);
  const root = findTaskById(tasks, selectedTask.rootId);

  function handleSaveDetails() {
    const parsedEstimate = draftEstimate.trim() === "" ? undefined : Number(draftEstimate);

    if (parsedEstimate !== undefined && Number.isNaN(parsedEstimate)) {
      window.alert("Estimated minutes must be a number.");
      return;
    }

    if (parsedEstimate !== undefined && parsedEstimate < 0) {
      window.alert("Estimated minutes cannot be negative.");
      return;
    }

    void updateSelectedTaskDetails({
      title: draftTitle,
      description: draftDescription,
      estimatedMinutes: parsedEstimate,
    });
  }

  function handleCreateSubtask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = newSubtaskTitle.trim();
    if (!cleanTitle) return;

    void addChildTask(selectedTask.id, cleanTitle);
    setNewSubtaskTitle("");
  }

  function handleDeleteTask() {
    const confirmed = window.confirm(
      `Delete "${selectedTask.title}" and all of its child tasks? This cannot be undone.`,
    );

    if (!confirmed) return;

    void deleteSelectedTask();
  }

  return (
    <aside className="details-panel">
      <div className="details-header">
        <div>
          <p className="eyebrow">Selected Task</p>
          <h2>{selectedTask.title}</h2>
        </div>

        <span className={selectedTask.completed ? "status complete" : "status open"}>
          {selectedTask.completed ? "Complete" : "Open"}
        </span>
      </div>

      <section className="task-editor">
        <label className="field-label" htmlFor="task-title">
          Task title
        </label>
        <input
          id="task-title"
          className="details-input"
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />

        <label className="field-label" htmlFor="task-description">
          Description
        </label>
        <textarea
          id="task-description"
          className="details-textarea"
          value={draftDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          placeholder="Add notes or context for this task..."
        />

        <label className="field-label" htmlFor="task-estimate">
          Estimated minutes
        </label>
        <input
          id="task-estimate"
          className="details-input"
          type="number"
          min="0"
          value={draftEstimate}
          onChange={(event) => setDraftEstimate(event.target.value)}
          placeholder="Example: 45"
        />

        <button className="save-details-button" type="button" onClick={handleSaveDetails}>
          Save Task Details
        </button>
      </section>

      <section className="subtask-editor">
        <h3>Add Subtask</h3>
        <p>Create a smaller task underneath the currently selected task.</p>

        <form onSubmit={handleCreateSubtask}>
          <label className="field-label" htmlFor="new-subtask">
            New subtask title
          </label>
          <div className="subtask-create-row">
            <input
              id="new-subtask"
              className="details-input"
              type="text"
              value={newSubtaskTitle}
              onChange={(event) => setNewSubtaskTitle(event.target.value)}
              placeholder={`Subtask under "${selectedTask.title}"`}
            />
            <button type="submit">Add</button>
          </div>
        </form>
      </section>

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
          <dt>Completion source</dt>
          <dd>{selectedTask.completionSource || "Not completed"}</dd>
        </div>
      </dl>

      <div className="details-actions">
        <button type="button" onClick={() => void toggleTaskComplete(selectedTask.id)}>
          {selectedTask.completed ? "Mark Open" : "Mark Complete"}
        </button>
        <button type="button">Schedule Task</button>
        <button className="danger-button" type="button" onClick={handleDeleteTask}>
          Delete Task
        </button>
      </div>
    </aside>
  );
}