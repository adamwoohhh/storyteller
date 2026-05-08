"use client";
import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { StoryNodeView } from "./StoryNode";
import { api } from "@/lib/client/api";

const nodeTypes = { story: StoryNodeView };

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
  const nodes = useMemo<Node[]>(
    () =>
      data.nodes.map((n: Any) => ({
        id: n.id,
        type: "story",
        position: { x: n.positionX || 0, y: n.positionY || 0 },
        data: {
          id: n.id,
          text: n.text,
          imagePrompt: n.imagePrompt,
          imageId: n.imageId,
          onChanged: reload,
        },
      })),
    [data.nodes, reload],
  );
  const edges = useMemo<Edge[]>(() => {
    const sorted = [...data.nodes].sort((a: Any, b: Any) => a.orderIndex - b.orderIndex);
    return sorted.slice(1).map((n: Any, i: number) => ({
      id: `e-${sorted[i]!.id}-${n.id}`,
      source: sorted[i]!.id,
      target: n.id,
      animated: false,
      style: { strokeDasharray: "4 4", opacity: 0.5 },
    }));
  }, [data.nodes]);

  function onNodeDragStop(_: unknown, n: Node) {
    api.patchNode(n.id, { positionX: n.position.x, positionY: n.position.y }).catch(() => {});
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between p-3 border-b">
        <h2 className="font-semibold">{data.story.title || "Untitled"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSwitch}>
            阅读态
          </Button>
        </div>
      </header>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
