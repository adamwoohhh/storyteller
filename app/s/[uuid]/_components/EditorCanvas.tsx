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
import Link from "next/link";
import { BookOpen, LayoutDashboard, Rows3 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StoryNodeView } from "./StoryNode";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { cn } from "@/lib/utils";
import {
  ADMIN_STORIES_HREF,
  getStoryDisplayTitle,
  getStoryModeAction,
} from "@/lib/story-navigation";
import { getEditorNodePosition, getOrganizedNodePositions } from "./editor-layout";
import { toast } from "sonner";
import { buildStoryGalleryItems } from "./image-gallery";
import {
  isBulkSceneRendering,
  renderProgressLabel,
  shouldAutoStartSceneRender,
} from "./editor-render-state";

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
  const galleryItems = useMemo(() => buildStoryGalleryItems(data), [data]);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const startingRenderRef = useRef(false);
  const renderJob = useJob(renderJobId);
  const isRenderingScenes = isBulkSceneRendering({
    storyStatus: data.story.status,
    jobId: renderJobId,
    jobStatus: renderJob.status,
  });
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
          isRendering: isRenderingScenes && !n.imageId,
          story: data.story,
          allCharacters: data.characters,
          galleryItems,
          onChanged: reload,
        },
      })),
    [sortedNodes, isRenderingScenes, data.story, data.characters, galleryItems, reload],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const modeAction = getStoryModeAction("edit");

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (!shouldAutoStartSceneRender(data.story.status) || renderJobId || startingRenderRef.current) {
      return;
    }

    let cancelled = false;
    startingRenderRef.current = true;
    api
      .renderAll(data.story.id)
      .then((result) => {
        if (!cancelled) setRenderJobId(result.jobId);
      })
      .catch((error: Error) => {
        toast.error(error.message || "启动插图生成失败");
      })
      .finally(() => {
        if (!cancelled) startingRenderRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [data.story.id, data.story.status, renderJobId]);

  useEffect(() => {
    if (!renderJob.progress) return;
    reload().catch(() => {});
  }, [renderJob.progress, reload]);

  useEffect(() => {
    if (renderJob.status !== "done" || !renderJobId) return;
    reload().catch(() => {});
  }, [renderJob.status, renderJobId, reload]);

  useEffect(() => {
    if (renderJob.status === "error" && renderJob.error) {
      toast.error(renderJob.error);
    }
  }, [renderJob.status, renderJob.error]);

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
      <header className="z-10 mb-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#5a3029]/15 bg-card/85 px-3 py-2 shadow-[0_3px_0_rgb(90_48_41_/_0.12)] backdrop-blur sm:px-4">
        <h2 className="min-w-0 truncate text-sm font-black text-foreground sm:text-base">
          {getStoryDisplayTitle(data.story.title)}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {isRenderingScenes && (
            <div className="hidden items-center rounded-full border border-[#5a3029]/20 bg-secondary px-3 py-1 text-xs font-black text-foreground sm:flex">
              生成插图{" "}
              {renderProgressLabel({ progress: renderJob.progress, totalNodes: sortedNodes.length })}
            </div>
          )}
          <Link
            href={ADMIN_STORIES_HREF}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">管理页</span>
          </Link>
          <Button variant="outline" size="sm" onClick={onSwitch}>
            <BookOpen className="size-4" />
            {modeAction.label}
          </Button>
        </div>
      </header>
      <div
        ref={canvasRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border-2 border-[#5a3029]/20 bg-[#fff8e8]/70"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={organizeNodes}
          disabled={organizing}
          className="absolute right-4 top-4 z-20 shadow-[0_4px_0_rgb(90_48_41_/_0.18)]"
        >
          <Rows3 className="size-4" />
          {organizing ? "整理中…" : "整理节点"}
        </Button>
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
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d7bd8a" gap={24} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
