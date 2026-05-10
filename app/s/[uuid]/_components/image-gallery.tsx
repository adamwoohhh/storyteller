"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  assetId: string;
  title: string;
  description?: string;
};

type StoryGalleryData = {
  characters: {
    id: string;
    name?: string | null;
    userImageId?: string | null;
    cdsImageId?: string | null;
  }[];
  nodes: {
    id: string;
    orderIndex: number;
    text?: string | null;
    imageId?: string | null;
  }[];
};

export function buildStoryGalleryItems(data: StoryGalleryData): GalleryItem[] {
  const characterItems = data.characters.flatMap((character) => {
    const title = character.name || "未命名角色";
    const items: GalleryItem[] = [];

    if (character.userImageId) {
      items.push({
        id: `character-upload-${character.id}`,
        assetId: character.userImageId,
        title,
        description: "上传参考图",
      });
    }

    if (character.cdsImageId) {
      items.push({
        id: `character-cds-${character.id}`,
        assetId: character.cdsImageId,
        title,
        description: "角色设计图",
      });
    }

    return items;
  });

  const nodeItems = [...data.nodes]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .flatMap((node, index) =>
      node.imageId
        ? [
            {
              id: `node-${node.id}`,
              assetId: node.imageId,
              title: `第 ${index + 1} 幕`,
              description: node.text || undefined,
            },
          ]
        : [],
    );

  return [...characterItems, ...nodeItems];
}

export function ImageGalleryThumb({
  items,
  assetId,
  alt,
  className,
  imageClassName,
}: {
  items: GalleryItem[];
  assetId: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const initialIndex = Math.max(
    0,
    items.findIndex((item) => item.assetId === assetId),
  );

  return (
    <>
      <button
        type="button"
        className={cn(
          "nodrag nopan block cursor-zoom-in overflow-hidden p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label="打开图片画廊"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/assets/${assetId}`}
          alt={alt ?? ""}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </button>
      {open && (
        <ImageGallery
          items={items}
          initialIndex={initialIndex}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

export function ImageGallery({
  items,
  initialIndex,
  open,
  onOpenChange,
}: {
  items: GalleryItem[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const playableItems = useMemo(() => items.filter((item) => item.assetId), [items]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = playableItems[currentIndex];

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex((index) => wrapIndex(index - 1, playableItems.length));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((index) => wrapIndex(index + 1, playableItems.length));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, playableItems.length]);

  function move(delta: number) {
    setCurrentIndex((index) => wrapIndex(index + delta, playableItems.length));
  }

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden rounded-[1.75rem] border-2 border-[#5a3029] bg-[#201915] p-0 text-white shadow-[8px_8px_0_#d9b76f] sm:max-w-5xl">
        <div className="grid max-h-[92vh] grid-rows-[auto_minmax(0,1fr)_auto]">
          <header className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-black text-white">
                {current.title}
              </DialogTitle>
              {current.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">
                  {current.description}
                </p>
              )}
            </div>
            <div className="shrink-0 pr-9 text-sm font-black text-white/70">
              {currentIndex + 1} / {playableItems.length}
            </div>
          </header>

          <div className="relative flex min-h-0 items-center justify-center bg-black/20 px-4 py-3">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
              onClick={() => move(-1)}
              disabled={playableItems.length < 2}
              aria-label="上一张"
            >
              <ChevronLeft className="size-5" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/assets/${current.assetId}`}
              alt={current.title}
              className="max-h-[68vh] max-w-full rounded-2xl object-contain"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
              onClick={() => move(1)}
              disabled={playableItems.length < 2}
              aria-label="下一张"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-5">
            {playableItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 opacity-70 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  index === currentIndex && "border-secondary opacity-100",
                )}
                onClick={() => setCurrentIndex(index)}
                aria-label={`查看${item.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/assets/${item.assetId}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return (index + length) % length;
}
