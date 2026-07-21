import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { Task } from "../types/task";
import { buildTaskTree, type TaskTreeNode } from "../utils/taskTree";

type TaskTreeDiagramProps = {
  compact?: boolean;
  title?: string;
  description?: string;
};

type TreeLineStyle = "diagonal" | "cornered";
type TreeNodeShape = "bubble" | "pill";

type LayoutNode = {
  id: string;
  title: string;
  completed: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutEdge = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

type TreeLayout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

type PartialLayout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  rootX: number;
  rootY: number;
};

const LEVEL_GAP = 92;
const SIBLING_GAP = 34;
const CANVAS_PADDING = 42;

function getRootGroups(tasks: Task[]) {
  const tree = buildTaskTree(tasks);

  return tree.map((root) => ({
    root,
    nodes: [root],
  }));
}

function getNodeSize(nodeShape: TreeNodeShape) {
  if (nodeShape === "bubble") {
    return {
      width: 128,
      height: 92,
    };
  }

  return {
    width: 194,
    height: 60,
  };
}

function shiftNodes(nodes: LayoutNode[], offsetX: number, offsetY: number) {
  return nodes.map((node) => ({
    ...node,
    x: node.x + offsetX,
    y: node.y + offsetY,
  }));
}

function shiftEdges(edges: LayoutEdge[], offsetX: number, offsetY: number) {
  return edges.map((edge) => ({
    ...edge,
    sourceX: edge.sourceX + offsetX,
    sourceY: edge.sourceY + offsetY,
    targetX: edge.targetX + offsetX,
    targetY: edge.targetY + offsetY,
  }));
}

function createPartialLayout(node: TaskTreeNode, nodeShape: TreeNodeShape): PartialLayout {
  const nodeSize = getNodeSize(nodeShape);
  const childLayouts = node.children.map((child) => createPartialLayout(child, nodeShape));
  const childrenWidth =
    childLayouts.length > 0
      ? childLayouts.reduce((total, child) => total + child.width, 0) +
        SIBLING_GAP * (childLayouts.length - 1)
      : 0;

  const width = Math.max(nodeSize.width, childrenWidth);
  const rootX = width / 2;
  const rootY = nodeSize.height / 2;
  const currentNode: LayoutNode = {
    id: node.id,
    title: node.title,
    completed: node.completed,
    x: rootX,
    y: rootY,
    width: nodeSize.width,
    height: nodeSize.height,
  };

  let cursorX = (width - childrenWidth) / 2;
  let nodes = [currentNode];
  let edges: LayoutEdge[] = [];
  let maxHeight = nodeSize.height;

  childLayouts.forEach((childLayout) => {
    const childOffsetX = cursorX;
    const childOffsetY = nodeSize.height + LEVEL_GAP;
    const shiftedChildNodes = shiftNodes(childLayout.nodes, childOffsetX, childOffsetY);
    const shiftedChildEdges = shiftEdges(childLayout.edges, childOffsetX, childOffsetY);
    const childRootNode = shiftedChildNodes[0];

    nodes = [...nodes, ...shiftedChildNodes];
    edges = [
      ...edges,
      {
        id: `${node.id}-${childRootNode.id}`,
        sourceX: rootX,
        sourceY: rootY + nodeSize.height / 2,
        targetX: childRootNode.x,
        targetY: childRootNode.y - childRootNode.height / 2,
      },
      ...shiftedChildEdges,
    ];

    maxHeight = Math.max(maxHeight, childOffsetY + childLayout.height);
    cursorX += childLayout.width + SIBLING_GAP;
  });

  return {
    nodes,
    edges,
    width,
    height: maxHeight,
    rootX,
    rootY,
  };
}

function createTreeLayout(root: TaskTreeNode, nodeShape: TreeNodeShape): TreeLayout {
  const partialLayout = createPartialLayout(root, nodeShape);
  const nodes = shiftNodes(partialLayout.nodes, CANVAS_PADDING, CANVAS_PADDING);
  const edges = shiftEdges(partialLayout.edges, CANVAS_PADDING, CANVAS_PADDING);

  return {
    nodes,
    edges,
    width: partialLayout.width + CANVAS_PADDING * 2,
    height: partialLayout.height + CANVAS_PADDING * 2,
  };
}

function createEdgePath(edge: LayoutEdge, lineStyle: TreeLineStyle) {
  if (lineStyle === "diagonal") {
    return `M ${edge.sourceX} ${edge.sourceY} L ${edge.targetX} ${edge.targetY}`;
  }

  const midpointY = edge.sourceY + (edge.targetY - edge.sourceY) / 2;

  return [
    `M ${edge.sourceX} ${edge.sourceY}`,
    `L ${edge.sourceX} ${midpointY}`,
    `L ${edge.targetX} ${midpointY}`,
    `L ${edge.targetX} ${edge.targetY}`,
  ].join(" ");
}

function shortTitle(title: string, nodeShape: TreeNodeShape) {
  const maxLength = nodeShape === "bubble" ? 32 : 44;

  if (title.length <= maxLength) return title;

  return `${title.slice(0, maxLength - 1)}…`;
}

function TreeSvg({
  root,
  lineStyle,
  nodeShape,
}: {
  root: TaskTreeNode;
  lineStyle: TreeLineStyle;
  nodeShape: TreeNodeShape;
}) {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const selectTask = useAppStore((state) => state.selectTask);

  const layout = useMemo(() => createTreeLayout(root, nodeShape), [nodeShape, root]);

  function handleNodeKeyDown(event: React.KeyboardEvent<SVGGElement>, taskId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTask(taskId);
    }
  }

  return (
    <svg
      className={`tree-svg ${nodeShape} ${lineStyle}`}
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={`Task tree for ${root.title}`}
    >
      <g className="tree-svg-edges">
        {layout.edges.map((edge) => (
          <path key={edge.id} d={createEdgePath(edge, lineStyle)} />
        ))}
      </g>

      <g className="tree-svg-nodes">
        {layout.nodes.map((node) => {
          const isSelected = selectedTaskId === node.id;
          const radius = nodeShape === "bubble" ? node.height / 2 : 999;

          return (
            <g
              key={node.id}
              className={isSelected ? "tree-svg-node selected" : "tree-svg-node"}
              role="button"
              tabIndex={0}
              transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
              onClick={() => selectTask(node.id)}
              onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
            >
              <rect width={node.width} height={node.height} rx={radius} ry={radius} />
              <foreignObject x="8" y="8" width={node.width - 16} height={node.height - 16}>
                <div className="tree-svg-node-content">
                  <span>{shortTitle(node.title, nodeShape)}</span>
                  {node.completed ? <small>Complete</small> : null}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function TaskTreeDiagram({
  compact = false,
  title = "Task Tree Diagram",
  description = "A visual tree layout of the current task hierarchy.",
}: TaskTreeDiagramProps) {
  const tasks = useAppStore((state) => state.tasks);
  const roots = getRootGroups(tasks);
  const [zoom, setZoom] = useState(1);
  const [lineStyle, setLineStyle] = useState<TreeLineStyle>("diagonal");
  const [nodeShape, setNodeShape] = useState<TreeNodeShape>("bubble");

  function zoomOut() {
    setZoom((currentZoom) => Math.max(0.65, Number((currentZoom - 0.1).toFixed(2))));
  }

  function zoomIn() {
    setZoom((currentZoom) => Math.min(1.3, Number((currentZoom + 0.1).toFixed(2))));
  }

  function resetZoom() {
    setZoom(1);
  }

  return (
    <section className={compact ? "tree-diagram-panel compact" : "tree-diagram-panel"}>
      <div className="tree-diagram-header">
        <div>
          <p className="eyebrow">Task Hierarchy</p>
          <h3>{title}</h3>
        </div>

        <div className="tree-diagram-actions">
          <span>
            {roots.length} root task{roots.length === 1 ? "" : "s"}
          </span>

          <button type="button" onClick={zoomOut}>
            -
          </button>
          <button className="zoom-reset-button" type="button" onClick={resetZoom}>
            Reset zoom · {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={zoomIn}>
            +
          </button>
        </div>
      </div>

      <p className="tree-diagram-description">{description}</p>

      <div className="tree-diagram-options">
        <div>
          <span>Node shape</span>
          <button
            className={nodeShape === "bubble" ? "active" : ""}
            type="button"
            onClick={() => setNodeShape("bubble")}
          >
            Circular
          </button>
          <button
            className={nodeShape === "pill" ? "active" : ""}
            type="button"
            onClick={() => setNodeShape("pill")}
          >
            Pill
          </button>
        </div>

        <div>
          <span>Edges</span>
          <button
            className={lineStyle === "diagonal" ? "active" : ""}
            type="button"
            onClick={() => setLineStyle("diagonal")}
          >
            Diagonal
          </button>
          <button
            className={lineStyle === "cornered" ? "active" : ""}
            type="button"
            onClick={() => setLineStyle("cornered")}
          >
            Cornered
          </button>
        </div>
      </div>

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
                <div className="root-tree-zoom-layer" style={{ transform: `scale(${zoom})` }}>
                  <TreeSvg root={root} lineStyle={lineStyle} nodeShape={nodeShape} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}