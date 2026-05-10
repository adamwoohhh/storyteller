"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";
import { toast } from "sonner";
import { StepFrame } from "./StepFrame";
import { buildStoryGalleryItems, ImageGalleryThumb } from "./image-gallery";

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
  const galleryItems = buildStoryGalleryItems(data);

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
    <StepFrame
      title="确认角色"
      description="从完整故事里捞出主角团，可以编辑、删除，或上传参考图。"
      currentStep="extract"
    >
      {job.status === "running" && (
        <div className="mb-4 rounded-full bg-secondary px-4 py-2 text-center text-sm font-black">
          正在提取角色…
        </div>
      )}
      <div className="space-y-4">
        {data.characters.map((c: Any) => (
          <Card key={c.id} className="space-y-3 bg-[#fff8e8] p-4">
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
                className="max-w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-black file:text-foreground"
                onChange={(e) => e.target.files?.[0] && uploadRef(c.id, e.target.files[0])}
              />
              {c.userImageId && (
                <ImageGalleryThumb
                  items={galleryItems}
                  assetId={c.userImageId}
                  alt=""
                  className="h-14 w-14 rounded-2xl border-2 border-[#5a3029]/30 object-cover"
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
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} disabled={data.characters.length === 0}>
          继续：分镜
        </Button>
      </div>
    </StepFrame>
  );
}
