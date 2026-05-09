"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Character {
  name: string;
  description: string;
  userImageId?: string;
}
interface Value {
  title: string;
  setting: string;
  opening: string;
  characters: Character[];
}

export function InputModeStructured({
  value,
  onChange,
}: {
  value: Value;
  onChange: (v: Value) => void;
}) {
  const set = (patch: Partial<Value>) => onChange({ ...value, ...patch });
  const upsertChar = (i: number, p: Partial<Character>) => {
    const next = [...value.characters];
    next[i] = { ...next[i]!, ...p };
    set({ characters: next });
  };
  return (
    <div className="mt-4 space-y-5">
      <div className="space-y-2">
        <Label className="font-black text-foreground">标题（可选）</Label>
        <Input value={value.title} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label className="font-black text-foreground">故事设定</Label>
        <Textarea
          rows={4}
          value={value.setting}
          onChange={(e) => set({ setting: e.target.value })}
          placeholder="例如：森林深处住着一群会说话的动物"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-black text-foreground">角色</Label>
        <div className="space-y-3">
          {value.characters.map((c, i) => (
            <Card key={i} className="space-y-3 bg-[#fff8e8] p-4">
              <Input
                placeholder="名字"
                value={c.name}
                onChange={(e) => upsertChar(i, { name: e.target.value })}
              />
              <Textarea
                placeholder="描述"
                rows={2}
                value={c.description}
                onChange={(e) => upsertChar(i, { description: e.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  set({ characters: value.characters.filter((_, j) => j !== i) })
                }
              >
                删除
              </Button>
            </Card>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set({ characters: [...value.characters, { name: "", description: "" }] })
            }
          >
            添加角色
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-black text-foreground">起始剧情</Label>
        <Textarea
          rows={3}
          value={value.opening}
          onChange={(e) => set({ opening: e.target.value })}
          placeholder="故事从哪里开始"
        />
      </div>
    </div>
  );
}
