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
      style: { stroke: "#8aa96b", strokeDasharray: "5 5", strokeWidth: 2, opacity: 0.8 },
    }));
  }, [data.nodes]);

  function onNodeDragStop(_: unknown, n: Node) {
    api.patchNode(n.id, { positionX: n.position.x, positionY: n.position.y }).catch(() => {});
  }

  return (
    <div className="story-bg flex h-screen flex-col p-3">
      <header className="z-10 mx-auto mb-3 flex w-full max-w-5xl items-center justify-between rounded-full border border-[#5a3029]/20 bg-card/90 px-4 py-3 shadow-[0_6px_0_rgb(90_48_41_/_0.14)] backdrop-blur">
        <h2 className="truncate pr-4 font-black text-foreground">
          {data.story.title || "Untitled"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSwitch}>
            阅读态
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border-2 border-[#5a3029]/20 bg-[#fff8e8]/70">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeDragStop={onNodeDragStop}
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
