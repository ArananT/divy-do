import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildTaskTree, type TaskTreeNode } from "../utils/taskTree";

type TaskPickerListProps = {
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
};

function TaskPickerNode({
  node,
  level,
  selectedTaskId,
  onSelectTask,
}: {
  node: TaskTreeNode;
  level: number;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}) {
  const isSelected = selectedTaskId === node.id;

  return (
    <>
      <button
        className={isSelected ? "task-picker-option selected" : "task-picker-option"}
        type="button"
        onClick={() => onSelectTask(node.id)}
        style={{ paddingLeft: `${0.75 + level * 1.1}rem` }}
      >
        <span className={node.completed ? "task-picker-dot complete" : "task-picker-dot"} />
        <span className="task-picker-option-text">
          <strong>{node.title}</strong>
          {node.estimatedMinutes ? <small>{node.estimatedMinutes} min estimate</small> : null}
        </span>
      </button>

      {node.children.map((child) => (
        <TaskPickerNode
          key={child.id}
          node={child}
          level={level + 1}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
        />
      ))}
    </>
  );
}

export function TaskPickerList({ selectedTaskId, onSelectTask }: TaskPickerListProps) {
  const tasks = useAppStore((state) => state.tasks);
  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  return (
    <div className="task-picker-list">
      {taskTree.length === 0 ? (
        <p>No tasks available yet.</p>
      ) : (
        taskTree.map((node) => (
          <TaskPickerNode
            key={node.id}
            node={node}
            level={0}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
          />
        ))
      )}
    </div>
  );
}