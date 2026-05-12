"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ART_STYLES, resolveArtStylePrompt } from "@/lib/art-styles";
import { api } from "@/lib/client/api";
import { toast } from "sonner";
import { StepFrame } from "./StepFrame";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function StepArtStyle({
  data,
  onNext,
  reload,
}: {
  data: Any;
  onNext: () => void;
  reload: () => Promise<void>;
}) {
  const [selectedKey, setSelectedKey] = useState<string>(
    data.story.artStyleKey || "watercolor-picturebook",
  );
  const [extra, setExtra] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const resolved = resolveArtStylePrompt(selectedKey, extra);

  async function confirm() {
    setSaving(true);
    try {
      await api.cds(data.story.id, {
        artStyleKey: selectedKey,
        artStylePrompt: resolved,
      });
      await reload();
      onNext();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepFrame
      title="选择画风"
      description="给绘本穿上一件外套，后面的角色图和插图都会沿用这个方向。"
      currentStep="style"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ART_STYLES.map((s) => (
          <Card
            key={s.id}
            onClick={() => setSelectedKey(s.id)}
            className={`cursor-pointer bg-[#fff8e8] p-4 transition-all hover:-translate-y-0.5 ${
              selectedKey === s.id
                ? "border-[#5a3029] bg-secondary shadow-[0_6px_0_#5a3029]"
                : ""
            }`}
          >
            <div className="font-black">{s.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-3 mt-1">
              {s.prompt || "完全自定义"}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <div className="text-sm font-black">追加自定义描述（可选）</div>
        <Textarea
          rows={3}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="例：偏暖色调，有怀旧感"
        />
      </div>
      <Card className="mt-5 bg-[#fff8e8] p-4">
        <div className="text-xs text-muted-foreground">最终画风 prompt：</div>
        <div className="text-sm mt-1 whitespace-pre-wrap">{resolved}</div>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button onClick={confirm} disabled={!resolved.trim() || saving}>
          {saving ? "保存中…" : "确认 → CDS"}
        </Button>
      </div>
    </StepFrame>
  );
}
