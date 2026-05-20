import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildTaskTree, type TaskTreeNode } from "../utils/taskTree";

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
            toggleTaskComplete(node.id);
          }}
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
  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Task Tree</h2>
          <p>Fake data prototype for testing hierarchical task organization.</p>
        </div>
        <button className="primary-button" type="button">+ New Task</button>
      </div>

      <ul className="task-tree">
        {tree.map((root) => (
          <TaskNode key={root.id} node={root} depth={0} />
        ))}
      </ul>
    </section>
  );
}
