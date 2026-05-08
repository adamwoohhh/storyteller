"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
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
      router.push(`/s/${id}?step=${mode === "paste" ? "extract" : "story"}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "创建失败";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Storyteller</h1>
      <p className="text-muted-foreground">把你的故事变成图文绘本</p>
      <Tabs value={mode} onValueChange={(v) => setMode(v as "structured" | "paste")}>
        <TabsList>
          <TabsTrigger value="structured">结构化输入</TabsTrigger>
          <TabsTrigger value="paste">粘贴完整故事</TabsTrigger>
        </TabsList>
        <TabsContent value="structured">
          <InputModeStructured value={structured} onChange={setStructured} />
        </TabsContent>
        <TabsContent value="paste">
          <InputModePaste value={paste} onChange={setPaste} />
        </TabsContent>
      </Tabs>
      <Button onClick={submit} disabled={busy} size="lg">
        {busy ? "创建中…" : "下一步"}
      </Button>
    </main>
  );
}
