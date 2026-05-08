"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepExtract({
  data,
  onNext,
  reload,
}: {
  data: Any;
  onNext: () => void;
  reload: () => Promise<void>;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (data.characters.length === 0 && jobId === null) {
      api
        .extractCharacters(data.story.id)
        .then((r) => setJobId(r.jobId))
        .catch((e: Error) => toast.error(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.story.id, data.characters.length]);

  useEffect(() => {
    if (job.status === "done") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  async function patchChar(id: string, body: Any) {
    await api.patchCharacter(id, body);
    await reload();
  }
  async function deleteChar(id: string) {
    await api.deleteCharacter(id);
    await reload();
  }
  async function uploadRef(id: string, file: File) {
    const { assetId } = await api.uploadFile(data.story.id, file);
    await api.patchCharacter(id, { userImageId: assetId });
    await reload();
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">确认角色</h2>
      <p className="text-sm text-muted-foreground">
        从你粘贴的故事中提取的角色。可以编辑、删除、添加，或为每个角色上传参考图。
      </p>
      {job.status === "running" && <div>提取中…</div>}
      <div className="space-y-3">
        {data.characters.map((c: Any) => (
          <Card key={c.id} className="p-3 space-y-2">
            <Input
              value={c.name}
              onChange={(e) => patchChar(c.id, { name: e.target.value })}
            />
            <Textarea
              rows={2}
              value={c.userInput}
              onChange={(e) => patchChar(c.id, { userInput: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && uploadRef(c.id, e.target.files[0])}
              />
              {c.userImageId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/assets/${c.userImageId}`}
                  alt=""
                  className="h-12 w-12 object-cover rounded"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteChar(c.id)}
                className="ml-auto"
              >
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={data.characters.length === 0}>
          继续 → 分镜
        </Button>
      </div>
    </main>
  );
}
