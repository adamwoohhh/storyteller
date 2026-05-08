"use client";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function ReadView({ data, onSwitch }: { data: Any; onSwitch: () => void }) {
  const sorted = [...data.nodes].sort((a: Any, b: Any) => a.orderIndex - b.orderIndex);
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 bg-background/90 backdrop-blur border-b z-10 flex items-center justify-between p-3">
        <h2 className="font-semibold">{data.story.title || "Untitled"}</h2>
        <Button variant="outline" onClick={onSwitch}>
          编辑态
        </Button>
      </header>
      <div className="max-w-2xl mx-auto py-8 space-y-16">
        {sorted.map((n: Any) => (
          <section key={n.id} className="space-y-4">
            {n.imageId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/assets/${n.imageId}`}
                alt=""
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                暂无图片
              </div>
            )}
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-center">{n.text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
