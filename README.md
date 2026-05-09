# Storyteller

把故事设定/角色/起始剧情（或一篇完整故事）变成图文绘本。Next.js + SQLite + 本地图片存储；BYO OpenAI key。

## Quick start

1. `cp .env.local.example .env.local` 并填入 `OPENAI_API_KEY`
2. `pnpm install`
3. `pnpm db:migrate`
4. `pnpm dev`，打开 http://localhost:3000

## 使用 fake provider 跑通流程（不烧 token）

```bash
PROVIDER_MODE=fake pnpm dev
```

## 测试

```bash
pnpm test          # 单元测试 (Vitest)
pnpm test:e2e      # 端到端 (Playwright，使用 fake provider)
```

## 评测（真实调用 OpenAI）

```bash
EVAL_JUDGE_MODEL=gpt-5 pnpm eval               # 全部
EVAL_JUDGE_MODEL=gpt-5 pnpm eval story-text    # 单个 stage
EVAL_JUDGE_MODEL=gpt-5 pnpm eval storyboard
```

报告写到 `evals/reports/<timestamp>.json`，便于回归对比。

## 数据

所有运行时数据集中在 `data/`：SQLite 文件 + 图片。`/data/` 已 gitignore。备份：打包整个目录。Docker 部署挂载 `-v ./data:/app/data`。

## 设计与计划

- 设计：`docs/superpowers/specs/2026-05-08-storyteller-design.md`
- 实现计划：`docs/superpowers/plans/2026-05-08-storyteller.md`
