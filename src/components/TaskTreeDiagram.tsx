import { useAppStore } from "../store/useAppStore";
import type { Task } from "../types/task";
import { buildTaskTree, type TaskTreeNode } from "../utils/taskTree";

type TaskTreeDiagramProps = {
  compact?: boolean;
  title?: string;
  description?: string;
};

function getRootGroups(tasks: Task[]) {
  const tree = buildTaskTree(tasks);

  return tree.map((root) => ({
    root,
    nodes: [root],
  }));
}

function DiagramNode({ node }: { node: TaskTreeNode }) {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);
  const isSelected = selectedTaskId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div className="diagram-node-wrapper">
      <button
        className={isSelected ? "diagram-task-node selected" : "diagram-task-node"}
        type="button"
        onClick={() => selectTask(node.id)}
      >
        <span>{node.title}</span>
        {node.completed ? <small>Complete</small> : null}
      </button>

      {hasChildren ? (
        <div className="diagram-branch-section">
          <div className="diagram-parent-line" />

          <div className="diagram-children-row">
            {node.children.map((child) => (
              <div key={child.id} className="diagram-child-column">
                <div className="diagram-child-line" />
                <DiagramNode node={child} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TaskTreeDiagram({
  compact = false,
  title = "Task Tree Diagram",
  description = "A visual tree layout of the current task hierarchy.",
}: TaskTreeDiagramProps) {
  const tasks = useAppStore((state) => state.tasks);
  const roots = getRootGroups(tasks);

  return (
    <section className={compact ? "tree-diagram-panel compact" : "tree-diagram-panel"}>
      <div className="tree-diagram-header">
        <div>
          <p className="eyebrow">Task Hierarchy</p>
          <h3>{title}</h3>
        </div>
        <span>
          {roots.length} root task{roots.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="tree-diagram-description">{description}</p>

      {roots.length === 0 ? (
        <div className="empty-state">
          <strong>No tasks yet</strong>
          <p>Create a task to see it appear in the tree diagram.</p>
        </div>
      ) : (
        <div className="root-diagram-list">
          {roots.map(({ root }) => (
            <article key={root.id} className="root-diagram-card">
              <div className="root-diagram-title">
                <span>Root task</span>
                <strong>{root.title}</strong>
              </div>

              <div className="root-tree-canvas">
                <DiagramNode node={root} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}