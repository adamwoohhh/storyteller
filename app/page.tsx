"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { ADMIN_STORIES_HREF } from "@/lib/story-navigation";
import { toast } from "sonner";
import { InputModeStructured } from "./_components/InputModeStructured";
import { InputModePaste } from "./_components/InputModePaste";

interface StructuredValue {
  title: string;
  setting: string;
  opening: string;
  characters: { name: string; description: string; userImageId?: string }[];
}

interface PasteValue {
  title: string;
  storyText: string;
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"structured" | "paste">("structured");
  const [structured, setStructured] = useState<StructuredValue>({
    setting: "",
    opening: "",
    title: "",
    characters: [],
  });
  const [paste, setPaste] = useState<PasteValue>({ title: "", storyText: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const body =
        mode === "structured"
          ? {
              inputMode: "structured" as const,
              title: structured.title,
              setting: structured.setting,
              opening: structured.opening,
              characters: structured.characters,
            }
          : {
              inputMode: "paste" as const,
              title: paste.title,
              storyText: paste.storyText,
              characters: [],
            };
      const { id } = await api.createStory(body);
      router.push(`/s/${id}?step=${mode === "paste" ? "storyboard" : "story"}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "创建失败";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="story-bg flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl text-center">
        <div className="mb-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="inline-flex items-center gap-3 rounded-full border border-[#5a3029]/20 bg-card/80 px-4 py-2 text-sm font-black text-primary shadow-[0_4px_0_rgb(90_48_41_/_0.16)]">
            <span className="flex size-9 items-center justify-center rounded-2xl border-2 border-[#5a3029] bg-secondary">
              <span className="size-4 rounded-full bg-primary" />
            </span>
            Storyteller
          </span>
          <Link href={ADMIN_STORIES_HREF} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <LayoutDashboard className="size-4" />
            管理页
          </Link>
        </div>

        <div className="story-panel p-5 text-left sm:p-8 lg:p-10">
          <div className="mx-auto mb-7 max-w-2xl text-center">
            <p className="mb-3 text-sm font-black text-primary">Q 版绘本创作台</p>
            <h1 className="text-3xl font-black leading-tight tracking-normal text-foreground sm:text-5xl">
              把一个小点子
              <span className="block text-primary">变成可爱的图文绘本</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              写下设定，或者直接粘贴完整故事。剩下的角色、分镜和插图，我们一步步搭起来。
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "structured" | "paste")}
            className="w-full items-center"
          >
            <TabsList>
              <TabsTrigger value="structured">结构化输入</TabsTrigger>
              <TabsTrigger value="paste">粘贴完整故事</TabsTrigger>
            </TabsList>
            <div className="mt-2 w-full">
              <TabsContent value="structured">
                <InputModeStructured value={structured} onChange={setStructured} />
              </TabsContent>
              <TabsContent value="paste">
                <InputModePaste value={paste} onChange={setPaste} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-7 flex justify-center">
            <Button onClick={submit} disabled={busy} size="lg" className="min-w-36">
              {busy ? "创建中…" : "下一步"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
