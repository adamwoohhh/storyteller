"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Value {
  title: string;
  storyText: string;
}

export function InputModePaste({
  value,
  onChange,
}: {
  value: Value;
  onChange: (v: Value) => void;
}) {
  return (
    <div className="mt-4 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="paste-title" className="font-black text-foreground">标题（可选）</Label>
        <Input
          id="paste-title"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paste-story-text" className="font-black text-foreground">完整故事</Label>
        <Textarea
          id="paste-story-text"
          rows={14}
          value={value.storyText}
          onChange={(e) => onChange({ ...value, storyText: e.target.value })}
          placeholder="把你写好的故事粘贴到这里…"
        />
      </div>
    </div>
  );
}
