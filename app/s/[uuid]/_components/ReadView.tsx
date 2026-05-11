"use client";
import Link from "next/link";
import { Edit3, LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_STORIES_HREF,
  getStoryDisplayTitle,
  getStoryModeAction,
} from "@/lib/story-navigation";
import { buildStoryGalleryItems, ImageGalleryThumb } from "./image-gallery";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function ReadView({ data, onSwitch }: { data: Any; onSwitch: () => void }) {
  const sorted = [...data.nodes].sort((a: Any, b: Any) => a.orderIndex - b.orderIndex);
  const galleryItems = buildStoryGalleryItems(data);
  const modeAction = getStoryModeAction("read");
  return (
    <main className="story-bg min-h-screen px-4 pb-12">
      <header className="sticky top-3 z-10 mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-[#5a3029]/15 bg-card/85 px-3 py-2 shadow-[0_3px_0_rgb(90_48_41_/_0.12)] backdrop-blur sm:px-4">
        <h2 className="min-w-0 truncate text-sm font-black text-foreground sm:text-base">
          {getStoryDisplayTitle(data.story.title)}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={ADMIN_STORIES_HREF}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">管理页</span>
          </Link>
          <Button variant="outline" size="sm" onClick={onSwitch}>
            <Edit3 className="size-4" />
            {modeAction.label}
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl py-12 space-y-16">
        {sorted.map((n: Any) => (
          <section key={n.id} className="space-y-5">
            {n.imageId ? (
              <ImageGalleryThumb
                items={galleryItems}
                assetId={n.imageId}
                alt=""
                className="w-full rounded-[2rem] border-2 border-[#5a3029] bg-card shadow-[10px_10px_0_#d9b76f]"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-[2rem] border-2 border-dashed border-[#5a3029]/30 bg-card text-sm font-black text-muted-foreground shadow-[10px_10px_0_#d9b76f]">
                暂无图片
              </div>
            )}
            <p className="rounded-3xl bg-card/80 px-5 py-4 text-center text-lg leading-8 whitespace-pre-wrap text-foreground">
              {n.text}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
