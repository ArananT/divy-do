import { useMemo, useState, type FormEvent } from "react";
import { useAppStore } from "../store/useAppStore";
import type { TaskFilter } from "../types/task";
import { buildTaskTree, filterTasks, type TaskTreeNode } from "../utils/taskTree";
import { TaskTreeDiagram } from "./TaskTreeDiagram";

type TaskTreeDisplayMode = "vertical" | "diagram";

function TaskNode({ node }: { node: TaskTreeNode }) {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);
  const toggleTaskComplete = useAppStore((state) => state.toggleTaskComplete);

  const isSelected = selectedTaskId === node.id;

  return (
    <li className="task-node">
      <div className={isSelected ? "task-row selected" : "task-row"}>
        <button className="task-select-button" type="button" onClick={() => selectTask(node.id)}>
          <span className="task-title">{node.title}</span>
          {node.estimatedMinutes ? (
            <span className="task-estimate">{node.estimatedMinutes} min</span>
          ) : null}
        </button>

        <label className="task-checkbox-label">
          <input
            aria-label={`Mark ${node.title} complete`}
            type="checkbox"
            checked={node.completed}
            onChange={() => void toggleTaskComplete(node.id)}
          />
        </label>
      </div>

      {node.children.length > 0 ? (
        <ul className="task-children">
          {node.children.map((child) => (
            <TaskNode key={child.id} node={child} />
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
  const addRootTask = useAppStore((state) => state.addRootTask);
  const resetSampleData = useAppStore((state) => state.resetSampleData);

  const [newRootTaskTitle, setNewRootTaskTitle] = useState("");
  const [displayMode, setDisplayMode] = useState<TaskTreeDisplayMode>("vertical");

  const filteredTasks = useMemo(() => filterTasks(tasks, taskFilter), [tasks, taskFilter]);
  const tree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks]);

  function handleCreateRootTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = newRootTaskTitle.trim();
    if (!cleanTitle) return;

    void addRootTask(cleanTitle);
    setNewRootTaskTitle("");
  }

  function filterButtonLabel(filter: TaskFilter) {
    if (filter === "all") return "All";
    if (filter === "open") return "Open";
    return "Completed";
  }

  return (
    <section className="panel task-tree-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Task Organization</p>
          <h1>Task Tree</h1>
        </div>

        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => void resetSampleData()}>
            Reset Sample Data
          </button>
        </div>
      </div>

      <form className="inline-create-form" onSubmit={handleCreateRootTask}>
        <label htmlFor="new-root-task">New main task</label>
        <div className="inline-create-row">
          <input
            id="new-root-task"
            className="light-input"
            type="text"
            value={newRootTaskTitle}
            onChange={(event) => setNewRootTaskTitle(event.target.value)}
            placeholder="Example: Honours Project"
          />
          <button type="submit">Create Task</button>
        </div>
      </form>

      <div className="task-toolbar">
        <div className="filter-row" aria-label="Task filters">
          {(["all", "open", "completed"] as TaskFilter[]).map((filter) => (
            <button
              key={filter}
              className={taskFilter === filter ? "filter-button active" : "filter-button"}
              type="button"
              onClick={() => setTaskFilter(filter)}
            >
              {filterButtonLabel(filter)}
            </button>
          ))}
        </div>

        <div className="view-toggle-row" aria-label="Task tree display mode">
          <button
            className={displayMode === "vertical" ? "filter-button active" : "filter-button"}
            type="button"
            onClick={() => setDisplayMode("vertical")}
          >
            Vertical View
          </button>
          <button
            className={displayMode === "diagram" ? "filter-button active" : "filter-button"}
            type="button"
            onClick={() => setDisplayMode("diagram")}
          >
            Tree View
          </button>
        </div>
      </div>

      {displayMode === "diagram" ? (
        <TaskTreeDiagram
          title="Tree View"
          description="A visual view of your root tasks and their subtasks. Select any node to edit it in the details panel."
        />
      ) : tree.length === 0 ? (
        <div className="empty-state">
          <strong>No tasks match this view.</strong>
          <p>Try another filter or create a new task.</p>
        </div>
      ) : (
        <ul className="task-tree-list">
          {tree.map((node) => (
            <TaskNode key={node.id} node={node} />
          ))}
        </ul>
      )}
    </section>
  );
}