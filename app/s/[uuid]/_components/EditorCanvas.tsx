"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  useNodesState,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { StoryNodeView } from "./StoryNode";
import { api } from "@/lib/client/api";
import { getEditorNodePosition, getOrganizedNodePositions } from "./editor-layout";
import { toast } from "sonner";

const nodeTypes = { story: StoryNodeView };
const NODE_WIDTH = 288;
const NODE_HEIGHT = 430;
const NODE_GAP_X = 56;
const NODE_GAP_Y = 88;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function EditorCanvas({
  data,
  onSwitch,
  reload,
}: {
  data: Any;
  onSwitch: () => void;
  reload: () => Promise<void>;
}) {
  const sortedNodes = useMemo(
    () => [...data.nodes].sort((a: Any, b: Any) => a.orderIndex - b.orderIndex),
    [data.nodes],
  );
  const initialNodes = useMemo<Node[]>(
    () =>
      sortedNodes.map((n: Any, index: number) => ({
        id: n.id,
        type: "story",
        position: getEditorNodePosition(n, index, sortedNodes),
        data: {
          id: n.id,
          text: n.text,
          characters: n.characters,
          imagePrompt: n.imagePrompt,
          imageId: n.imageId,
          story: data.story,
          allCharacters: data.characters,
          onChanged: reload,
        },
      })),
    [sortedNodes, data.story, data.characters, reload],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const [organizing, setOrganizing] = useState(false);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const edges = useMemo<Edge[]>(() => {
    return sortedNodes.slice(1).map((n: Any, i: number) => ({
      id: `e-${sortedNodes[i]!.id}-${n.id}`,
      source: sortedNodes[i]!.id,
      target: n.id,
      animated: false,
      style: { stroke: "#8aa96b", strokeDasharray: "5 5", strokeWidth: 2, opacity: 0.8 },
    }));
  }, [sortedNodes]);

  function onNodeDragStop(_: unknown, n: Node) {
    api.patchNode(n.id, { positionX: n.position.x, positionY: n.position.y }).catch(() => {});
  }

  async function organizeNodes() {
    if (nodes.length === 0) return;

    const canvasWidth = canvasRef.current?.clientWidth ?? NODE_WIDTH;
    const positions = getOrganizedNodePositions({
      count: nodes.length,
      canvasWidth,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
      nodeHeights: nodes.map((node) => node.height ?? NODE_HEIGHT),
      gapX: NODE_GAP_X,
      gapY: NODE_GAP_Y,
    });
    const arranged = nodes.map((node, index) => ({
      ...node,
      position: positions[index]!,
    }));

    setOrganizing(true);
    setNodes(arranged);
    window.requestAnimationFrame(() => flowRef.current?.fitView({ padding: 0.16 }));

    try {
      await Promise.all(
        arranged.map((node) =>
          api.patchNode(node.id, {
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "整理节点失败");
    } finally {
      setOrganizing(false);
    }
  }

  return (
    <div className="story-bg flex h-screen flex-col p-3">
      <header className="z-10 mx-auto mb-3 flex w-full max-w-5xl items-center justify-between rounded-full border border-[#5a3029]/20 bg-card/90 px-4 py-3 shadow-[0_6px_0_rgb(90_48_41_/_0.14)] backdrop-blur">
        <h2 className="truncate pr-4 font-black text-foreground">
          {data.story.title || "Untitled"}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={organizeNodes} disabled={organizing}>
            {organizing ? "整理中…" : "整理节点"}
          </Button>
          <Button variant="outline" onClick={onSwitch}>
            阅读态
          </Button>
        </div>
      </header>
      <div
        ref={canvasRef}
        className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border-2 border-[#5a3029]/20 bg-[#fff8e8]/70"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onInit={(instance) => {
            flowRef.current = instance;
          }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          fitView
        >
          <Background color="#d7bd8a" gap={24} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
