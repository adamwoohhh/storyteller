"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { useJob } from "@/lib/client/useJob";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepCDS({
  data,
  onNext,
  reload,
}: {
  data: Any;
  onNext: () => void;
  reload: () => Promise<void>;
}) {
  const [renderJob, setRenderJob] = useState<{ id: string; charId: string } | null>(null);
  const job = useJob(renderJob?.id ?? null);

  useEffect(() => {
    if (job.status === "done") {
      reload();
      setRenderJob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status]);

  async function patch(id: string, body: Any) {
    await api.patchCharacter(id, body);
    await reload();
  }
  async function render(id: string) {
    const r = await api.renderCharacter(id);
    setRenderJob({ id: r.jobId, charId: id });
  }

  const allConfirmed =
    data.characters.length > 0 && data.characters.every((c: Any) => c.confirmed);

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h2 className="text-xl font-semibold">Character Design Sheet</h2>
      <p className="text-sm text-muted-foreground">
        编辑每个角色的 4 个字段，生成参考图，确认后即可批量生成插图。
      </p>
      <div className="space-y-4">
        {data.characters.map((c: Any) => (
          <Card key={c.id} className="p-4 space-y-3">
            <div className="font-medium">{c.name}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>外貌</Label>
                <Textarea
                  rows={3}
                  value={c.cdsAppearance}
                  onChange={(e) => patch(c.id, { cdsAppearance: e.target.value })}
                />
              </div>
              <div>
                <Label>服饰</Label>
                <Textarea
                  rows={3}
                  value={c.cdsOutfit}
                  onChange={(e) => patch(c.id, { cdsOutfit: e.target.value })}
                />
              </div>
              <div>
                <Label>特征</Label>
                <Textarea
                  rows={3}
                  value={c.cdsTraits}
                  onChange={(e) => patch(c.id, { cdsTraits: e.target.value })}
                />
              </div>
              <div>
                <Label>风格</Label>
                <Textarea
                  rows={3}
                  value={c.cdsStyle}
                  onChange={(e) => patch(c.id, { cdsStyle: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {c.cdsImageId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/assets/${c.cdsImageId}`}
                  alt=""
                  className="h-32 w-32 object-cover rounded border"
                />
              ) : (
                <div className="h-32 w-32 rounded border flex items-center justify-center text-xs text-muted-foreground">
                  未生成
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => render(c.id)}
                  disabled={!!renderJob}
                >
                  {renderJob?.charId === c.id && job.status === "running"
                    ? "生成中…"
                    : c.cdsImageId
                      ? "重新生成参考图"
                      : "生成参考图"}
                </Button>
                <Button
                  size="sm"
                  variant={c.confirmed ? "default" : "outline"}
                  onClick={() => patch(c.id, { confirmed: !c.confirmed })}
                  disabled={!c.cdsImageId}
                >
                  {c.confirmed ? "✓ 已确认" : "确认"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!allConfirmed}>
          开始生成插图
        </Button>
      </div>
    </main>
  );
}
