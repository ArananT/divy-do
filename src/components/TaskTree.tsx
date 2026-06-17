import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildTaskTree, filterTasks, type TaskTreeNode } from "../utils/taskTree";

function TaskNode({ node, depth }: { node: TaskTreeNode; depth: number }) {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);
  const toggleTaskComplete = useAppStore((state) => state.toggleTaskComplete);
  const isSelected = selectedTaskId === node.id;

  return (
    <li className="task-node">
      <div
        className={isSelected ? "task-row selected" : "task-row"}
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
      >
        <button
          className={node.completed ? "checkbox checked" : "checkbox"}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void toggleTaskComplete(node.id);
          }}
          aria-label={node.completed ? "Mark task as open" : "Mark task as complete"}
        >
          {node.completed ? "✓" : ""}
        </button>

        <button className="task-title-button" type="button" onClick={() => selectTask(node.id)}>
          <span className={node.completed ? "task-title completed" : "task-title"}>
            {node.title}
          </span>
          {node.estimatedMinutes ? <small>{node.estimatedMinutes} min</small> : null}
        </button>
      </div>

      {node.children.length > 0 ? (
        <ul className="task-children">
          {node.children.map((child) => (
            <TaskNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TaskTree() {
  const tasks = useAppStore((state) => state.tasks);
  const taskFilter = useAppStore((state) => state.taskFilter);
  const setTaskFilter = useAppStore((state) => state.setTaskFilter);
  const isLoading = useAppStore((state) => state.isLoading);
  const errorMessage = useAppStore((state) => state.errorMessage);
  const addRootTask = useAppStore((state) => state.addRootTask);
  const resetSampleData = useAppStore((state) => state.resetSampleData);
  const [newRootTaskTitle, setNewRootTaskTitle] = useState("");

  const filteredTasks = useMemo(() => filterTasks(tasks, taskFilter), [tasks, taskFilter]);
  const tree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks]);

  function handleCreateRootTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = newRootTaskTitle.trim();
    if (!cleanTitle) return;

    void addRootTask(cleanTitle);
    setNewRootTaskTitle("");
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Task Tree</h2>
          <p>
            Working prototype area for creating, saving, completing, filtering, and organizing tasks
            in a hierarchy.
          </p>
        </div>

        <button className="secondary-button" type="button" onClick={() => void resetSampleData()}>
          Reset Sample Data
        </button>
      </div>

      <form className="inline-create-form" onSubmit={handleCreateRootTask}>
        <label className="field-label" htmlFor="new-root-task">
          New main task
        </label>
        <div className="inline-create-row">
          <input
            id="new-root-task"
            className="light-input"
            type="text"
            value={newRootTaskTitle}
            onChange={(event) => setNewRootTaskTitle(event.target.value)}
            placeholder="Example: Honours Project"
          />
          <button className="primary-button" type="submit">
            Create Task
          </button>
        </div>
      </form>

      <div className="button-row filter-row">
        <button
          className={taskFilter === "all" ? "secondary-button active-filter" : "secondary-button"}
          type="button"
          onClick={() => setTaskFilter("all")}
        >
          All
        </button>
        <button
          className={taskFilter === "open" ? "secondary-button active-filter" : "secondary-button"}
          type="button"
          onClick={() => setTaskFilter("open")}
        >
          Open
        </button>
        <button
          className={
            taskFilter === "completed" ? "secondary-button active-filter" : "secondary-button"
          }
          type="button"
          onClick={() => setTaskFilter("completed")}
        >
          Completed
        </button>
      </div>

      {isLoading ? <p className="info-message">Loading tasks from local database...</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      {tree.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks to show</h3>
          <p>
            Try changing the filter or creating a new main task. Tasks saved here will remain after
            restarting the app.
          </p>
        </div>
      ) : (
        <ul className="task-tree">
          {tree.map((root) => (
            <TaskNode key={root.id} node={root} depth={0} />
          ))}
        </ul>
      )}
    </section>
  );
}