# Storyteller — 故事绘本生成应用 设计文档

**日期**：2026-05-08
**状态**：设计已确认，待实现计划

## 1. 概述

Storyteller 是一个将用户的故事构思转换为图文绘本的 Web 应用。
用户输入故事设定/角色/起始剧情（或直接粘贴完整故事），应用按以下流水线产出可在画布中查看的图文绘本：

1. **故事文本** —— 完整故事散文（产物 1，可独立评测）
2. **分镜 + 画面提示词** —— 节点化的剧情切片，每节点带专为生图优化的 `image_prompt`（产物 2，可独立评测）
3. **统一画风** —— 系统预置画风供用户选择/编辑，覆盖所有图片生成
4. **Character Design Sheet (CDS)** —— 每个角色的结构化文本设定 + 参考图，保证多张插图人物一致
5. **节点剧情图** —— 以 CDS 参考图 + 画风 + image_prompt 生成
6. **画布展示** —— 编辑态自由画布（React Flow），阅读态线性滚动

## 2. 设计目标 / 非目标

### 目标
- 完整跑通"输入 → 文本 → 分镜 → 画风 → CDS → 插图 → 绘本"闭环
- 各产物可独立评测，便于后续质量优化
- Provider 抽象，未来可低成本扩展到非 OpenAI 模型
- 部署简单（Next.js 单仓 + SQLite + 本地文件存储）

### 非目标（YAGNI）
- 用户账号体系、权限隔离
- 故事版本历史、撤销 / 协作编辑
- 分支故事
- 多语言（默认中文）
- 监控、埋点

## 3. 架构

### 3.1 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Next.js (App Router) + TypeScript |
| API 路由 | Next.js Route Handlers (Node runtime) |
| 数据库 | SQLite + Drizzle ORM |
| 文件存储 | 本地文件系统 (`storage/images/{story_id}/{asset_id}.png`) |
| 前端样式 | Tailwind CSS + shadcn/ui |
| 画布 | React Flow（编辑态） |
| 模型 (MVP) | OpenAI 文本 (Responses API) + `gpt-image-1` |
| 测试 | Vitest（单测）/ Playwright（E2E）/ 自定义 eval runner |

### 3.2 目录结构

```
app/
  page.tsx                       新建故事
  s/[uuid]/page.tsx              故事页（按 step 渲染向导/编辑/阅读）
  api/
    stories/route.ts             POST 创建
    stories/[id]/route.ts        GET 读取
    stories/[id]/revise-text/route.ts
    stories/[id]/extract-characters/route.ts
    stories/[id]/storyboard/route.ts
    stories/[id]/cds/route.ts
    stories/[id]/render-all/route.ts
    characters/[id]/route.ts     PATCH 编辑
    characters/[id]/render/route.ts
    nodes/[id]/route.ts          PATCH/DELETE
    nodes/[id]/render/route.ts
    uploads/route.ts             POST multipart
    assets/[id]/route.ts         GET 图片字节
    sse/jobs/[id]/route.ts       SSE 进度

lib/
  providers/
    types.ts                     TextProvider / ImageProvider 接口
    openai-text.ts
    openai-image.ts
    fake-text.ts                 测试用
    fake-image.ts                测试用
    factory.ts                   按 PROVIDER_MODE 选择实现
  pipeline/
    story-text.ts                产物 1：故事文本（流式）
    storyboard.ts                产物 2：分镜 + image_prompt
    character-extract.ts         粘贴模式：从原文提取角色草稿
    character-design.ts          产物 3a：CDS 文本
    scene-render.ts              产物 4：拼装最终 image prompt + 调用 ImageProvider
  jobs/
    queue.ts                     内存队列 + 并发限制
    runner.ts                    job 执行 + 状态写库 + SSE 推送
    sse-bus.ts                   按 jobId 分发事件
  db/
    schema.ts                    Drizzle 表定义
    client.ts                    单例 connection
    migrations/
  art-styles.ts                  预置画风列表与 prompt 模板
  config.ts                      .env 解析（API key、并发数等）

data/                            运行时数据（整个目录 gitignore）
  storyteller.db                 SQLite 主文件
  storyteller.db-shm             SQLite WAL 共享内存（运行时生成）
  storyteller.db-wal             SQLite WAL 日志（运行时生成）
  images/{story_id}/{asset_id}.png   生成图与用户上传图

evals/
  runner.ts                      手动触发：pnpm eval
  cases/story-text/*.json        故事文本评测用例
  cases/storyboard/*.json        分镜评测用例
  judges/                        LLM-as-judge prompt
  reports/                       输出报告

tests/
  unit/                          Vitest
  e2e/                           Playwright
```

### 3.3 Provider 抽象

```ts
// lib/providers/types.ts

export interface StoryInput {
  setting: string;
  characters: { name: string; description: string }[];
  opening: string;
}

export interface NodeDraft {
  order_index: number;
  text: string;
  image_prompt: string;
  characters: string[];   // character ids
}

export interface CDSDraft {
  characterId: string;
  appearance: string;     // 外貌
  outfit: string;         // 服饰
  traits: string;         // 特征
  style: string;          // 风格说明（与全局画风协同）
}

export interface TextProvider {
  generateStory(input: StoryInput, opts?: { revisePromptOnto?: string; revisePrompt?: string }): AsyncIterable<string>;
  generateStoryboard(storyText: string, opts: { mode: 'structured' | 'paste'; characterIds: string[] }): Promise<NodeDraft[]>;
  extractCharacters(storyText: string): Promise<{ name: string; description: string }[]>;
  generateCDS(args: { characters: { id: string; name: string; description: string }[]; storyText: string; artStylePrompt: string }): Promise<CDSDraft[]>;
}

export interface ImageProvider {
  generateImage(opts: {
    prompt: string;
    referenceImages?: Buffer[];
    size?: '1024x1024' | '1024x1536' | '1536x1024';
  }): Promise<Buffer>;
}
```

API key 由 `lib/config.ts` 在启动时从 `.env.local` 读取并注入到 provider 工厂；调用时 provider 实例自带 key，无需通过请求参数传递。

## 4. 数据模型

```ts
// lib/db/schema.ts

stories
  id            uuid primary key
  title         text
  input_mode    text             // 'structured' | 'paste'
  setting       text             // 仅 structured
  opening       text             // 仅 structured
  story_text    text             // 产物 1
  art_style_key text             // 预置 id 或 'custom'
  art_style_prompt text          // 已解析 + 用户编辑后的最终 prompt
  status        text             // draft | text_done | storyboard_done | style_done | cds_done | rendering | done
  created_at    int
  updated_at    int

characters
  id            uuid pk
  story_id      uuid fk
  name          text
  user_input    text             // 用户输入或从原文提取的描述
  user_image_id uuid fk → assets nullable    // 用户上传的参考图
  cds_appearance text
  cds_outfit    text
  cds_traits    text
  cds_style     text
  cds_image_id  uuid fk → assets nullable    // 产物 3b
  confirmed     bool             // 用户是否已点击"确认"

nodes
  id            uuid pk
  story_id      uuid fk
  order_index   int
  text          text             // 产物 2 之节点文本（paste 模式时是原文切片）
  image_prompt  text             // 产物 2 之画面描述
  characters    text             // JSON 数组：出场角色 id
  image_id      uuid fk → assets nullable    // 产物 4
  position_x    real
  position_y    real

assets
  id            uuid pk
  story_id      uuid fk
  kind          text             // 'cds' | 'scene' | 'user_upload'
  file_path     text             // 相对项目根的路径，如 data/images/{story_id}/{asset_id}.png
  mime          text
  created_at    int

jobs
  id            uuid pk
  story_id      uuid fk
  kind          text             // generate_story | revise_story | storyboard | extract_chars | cds_text | cds_image | scene_render
  target_id     text             // node_id 或 character_id（视 kind 而定）
  status        text             // pending | running | done | error | canceled
  error         text nullable
  created_at    int
  updated_at    int
```

## 5. 流水线（Pipeline）

每个 Stage 独立函数 + 独立产物 + 独立可评测（Stage 编号与第 6 节的用户旅程步骤不一一对应）：

| Stage | 函数 | 输入 | 输出 |
|-------|------|------|------|
| S1 | `story-text.generate` | `StoryInput` (+ optional revise prompt) | `string` (流式) |
| S2 | `character-extract.run` | `story_text`（仅 paste 模式调用） | `{name, description}[]` |
| S3 | `storyboard.generate` | `story_text` + 角色列表 + mode | `NodeDraft[]` |
| S4 | `character-design.generateText` | 角色 + 画风 + 故事 | `CDSDraft[]` |
| S5 | `character-design.generateImage` | CDS 文本 + 画风 + 用户上传图（可选） | 图片 Buffer |
| S6 | `scene-render.run` | 节点 + CDS 图 + 画风 | 图片 Buffer |

**生图时的最终 prompt 拼接顺序**：
```
art_style_prompt
+ 出场角色 CDS 文本 (appearance/outfit/traits/style)
+ 节点 image_prompt
```
**reference_images**：该节点出场角色的 `cds_image`（按出场顺序）。

## 6. 用户旅程（向导式 7 步）

```
1  输入            ── 模式 A 结构化 / 模式 B 粘贴完整故事；角色可选上传参考图
2  故事文本        ── A: 流式生成 + 可追加修订提示词反复改 + 可手动编辑
                       B: 直接使用用户原文 + 模型提取角色 → 用户确认/补充
3  分镜            ── 生成节点；A 模式可编辑节点文本；B 模式 text 锁定从原文切片，仅 image_prompt 可编辑
4  画风            ── 卡片网格选预置；可编辑/追加自定义文字；落 stories.art_style_prompt
5  CDS             ── 每角色 4 字段(外貌/服饰/特征/风格)结构化编辑 → 生成参考图（采纳画风+用户上传图）
                       不满意可改文本重生 → 必须 ✓ 确认
6  批量插图         ── 并发上限默认 3；每节点完成事件经 SSE 推送；失败节点单独 [重试]
7  编辑态 / 阅读态  ── 编辑态 React Flow（拖拽位置、单节点重生图/文、删除、加节点）
                       阅读态线性滚动（图上文下，居中留白）；通过 mode 参数切换
```

## 7. 长任务 (Job) 模型

- 所有耗时操作（文本生成、分镜、CDS、生图）均创建 `jobs` 记录
- 内存队列 + `JOB_CONCURRENCY`（默认 3，`.env` 可调）限制并发
- 前端通过 `GET /api/sse/jobs/:id` 订阅进度：
  - `event: chunk` — 流式文本片段
  - `event: progress` — 阶段性进度（如 "rendering 3/10"）
  - `event: done` — 含最终结果引用（asset id / story_text 长度等）
  - `event: error` — 含错误信息
- 用户取消 → `DELETE /api/jobs/:id` → 中止上游流式调用，job → canceled

## 8. 画风预置

写在 `lib/art-styles.ts`，不入库：

```ts
export const ART_STYLES = [
  { id: 'watercolor-picturebook', name: '水彩绘本', prompt: '...' },
  { id: 'ghibli-anime',           name: '吉卜力动画',  prompt: '...' },
  { id: 'american-comic',         name: '美式漫画',   prompt: '...' },
  { id: 'pixel-art',              name: '像素风',     prompt: '...' },
  { id: 'oil-painting',           name: '古典油画',   prompt: '...' },
  { id: 'cinematic-cg',           name: '写实电影 CG',prompt: '...' },
  { id: 'ink-wash',               name: '水墨',       prompt: '...' },
  { id: 'custom',                 name: '自定义',     prompt: '' },
];
```

用户选择后该 prompt 进入 `stories.art_style_prompt`，可继续编辑追加用户描述（如 "偏暖色调"）。

## 9. 错误处理

| 错误类别 | 策略 |
|---------|------|
| OpenAI 5xx / 网络 | 不自动重试；UI 显示 [重试] 按钮 |
| 429 速率限制 | 指数退避自动重试 3 次；超限标 error |
| Key 缺失/401 | 启动时校验存在；调用 401 → 明确提示检查 `.env` |
| 结构化输出解析失败 | 自动重试 1 次；仍失败让用户决定 |
| 单节点图失败（批量场景） | 不影响其他节点；该节点显示错误占位 + [重试] |
| 用户取消 | 中止 OpenAI streaming，job=canceled |
| 上传过大/非图片 | 客户端校验大小 < 5MB + 类型；服务端二次校验 |

设计原则：**网络/速率类自动重试，业务/解析类让用户决定**——避免静默重复花钱。

## 10. 测试策略

### 10.1 单元测试 (Vitest)
- `lib/pipeline/*` 每个函数独立测；mock provider，断言调用形式与产物结构
- `lib/providers/*` 用 msw 拦截 HTTP，验证 OpenAI 请求 payload
- `lib/jobs/*` 测试并发限制、cancel 行为、SSE 事件序列

### 10.2 评测集 (`evals/`)
- 手动触发：`pnpm eval`，使用 `.env.eval` 真实 key
- **故事文本评测**：固定 N 个输入（不同设定/角色/起点），生成 → LLM-as-judge 打分（连贯性 / 角色一致性 / 起承转合 / 与输入贴合度）
- **分镜评测**：给定固定故事文本生成分镜 → judge 打分（节点数合理性 / image_prompt 视觉信息密度 / 角色出场覆盖）
- 输出 JSON 报告（case-level + 总分），便于回归对比
- 各评测可独立运行，不依赖另一步当次输出
- MVP 阶段仅模型评分；后续可加人工评分页面（不在本次范围）

### 10.3 E2E (Playwright)
- 仅覆盖向导能跑通到底，使用 `PROVIDER_MODE=fake`
- Case：结构化模式走完全程；粘贴模式走完全程；单节点重生
- 不测画布拖拽与样式

## 11. 配置 (`.env.local`)

```
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-5
OPENAI_IMAGE_MODEL=gpt-image-1
JOB_CONCURRENCY=3
PROVIDER_MODE=openai           # fake | openai
DATABASE_URL=file:./data/storyteller.db
STORAGE_DIR=./data/images
```

## 12. 部署

- 自托管 Node：`pnpm build && pnpm start`
- 无 Serverless 时限问题（生图 60s+ 安全）
- 所有运行时数据集中在 `data/` 目录（DB + 图片），打包 / 备份 / Docker 卷挂载（`-v ./data:/app/data`）一步搞定
- 无需对象存储、无需消息队列
- `.gitignore` 仅需一行：`/data/`

## 13. 范围之外（明确不做）

- 用户账号、登录、付费
- 故事/资产权限模型（任何人有 UUID 即可访问）
- 多用户协作、实时同步
- 故事/CDS 版本历史与撤销
- 分支故事 / 选项剧情
- 监控、埋点、A/B 测试基础设施
- 多语言界面（界面与 prompt 默认中文）
- PDF 导出（保留 Roadmap，本次不做；阅读态可借浏览器打印）
- 自定义 provider 列表 UI（架构留扩展点，UI 暂不开放）
