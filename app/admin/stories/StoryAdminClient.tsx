"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Home, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils";

type StoryRow = {
  id: string;
  title: string;
  inputMode: "structured" | "paste";
  status: "draft" | "text_done" | "storyboard_done" | "style_done" | "cds_done" | "rendering" | "done";
  createdAt: number;
  updatedAt: number;
  characterCount: number;
  nodeCount: number;
};

const statusLabels: Record<StoryRow["status"], string> = {
  draft: "草稿",
  text_done: "文本完成",
  storyboard_done: "分镜完成",
  style_done: "风格完成",
  cds_done: "角色图完成",
  rendering: "渲染中",
  done: "完成",
};

const inputModeLabels: Record<StoryRow["inputMode"], string> = {
  structured: "结构化",
  paste: "粘贴故事",
};

function formatTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value * 1000));
}

export function StoryAdminClient({ stories }: { stories: StoryRow[] }) {
  const router = useRouter();

  async function deleteStory(story: StoryRow) {
    const title = story.title.trim() || "未命名故事";
    if (!window.confirm(`确定删除「${title}」吗？故事记录会保留，但默认列表和编辑页将不再显示。`)) {
      return;
    }

    try {
      await api.deleteStory(story.id);
      toast.success("故事已删除");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  }

  return (
    <main className="story-bg min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-primary">Storyteller Admin</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal text-foreground">故事管理</h1>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            <Home className="size-4" />
            创作台
          </Link>
        </div>

        <div className="story-panel overflow-hidden p-0">
          {stories.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
              <div>
                <h2 className="text-xl font-black text-foreground">还没有可管理的故事</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  创建故事后，它们会出现在这里。
                </p>
              </div>
              <Link href="/" className={cn(buttonVariants())}>
                创建故事
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#5a3029]/15 bg-card/70 text-xs font-black text-muted-foreground">
                    <th className="px-5 py-4">故事</th>
                    <th className="px-4 py-4">状态</th>
                    <th className="px-4 py-4">输入</th>
                    <th className="px-4 py-4">角色</th>
                    <th className="px-4 py-4">分镜</th>
                    <th className="px-4 py-4">创建</th>
                    <th className="px-4 py-4">更新</th>
                    <th className="px-5 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => {
                    const title = story.title.trim() || "未命名故事";
                    return (
                      <tr key={story.id} className="border-b border-[#5a3029]/10 last:border-b-0">
                        <td className="max-w-[280px] px-5 py-4">
                          <div className="truncate text-sm font-black text-foreground" title={title}>
                            {title}
                          </div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">{story.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge>{statusLabels[story.status]}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {inputModeLabels[story.inputMode]}
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-foreground">
                          {story.characterCount}
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-foreground">{story.nodeCount}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatTime(story.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {formatTime(story.updatedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/s/${story.id}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              <Eye className="size-4" />
                              查看
                            </Link>
                            <Button variant="destructive" size="sm" onClick={() => deleteStory(story)}>
                              <Trash2 className="size-4" />
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
