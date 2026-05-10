"use client";
import { Button } from "@/components/ui/button";
import { buildStoryGalleryItems, ImageGalleryThumb } from "./image-gallery";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function ReadView({ data, onSwitch }: { data: Any; onSwitch: () => void }) {
  const sorted = [...data.nodes].sort((a: Any, b: Any) => a.orderIndex - b.orderIndex);
  const galleryItems = buildStoryGalleryItems(data);
  return (
    <main className="story-bg min-h-screen px-4 pb-12">
      <header className="sticky top-4 z-10 mx-auto flex max-w-4xl items-center justify-between rounded-full border border-[#5a3029]/20 bg-card/90 px-4 py-3 shadow-[0_6px_0_rgb(90_48_41_/_0.14)] backdrop-blur">
        <h2 className="truncate pr-4 font-black text-foreground">
          {data.story.title || "Untitled"}
        </h2>
        <Button variant="outline" onClick={onSwitch}>
          编辑态
        </Button>
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
