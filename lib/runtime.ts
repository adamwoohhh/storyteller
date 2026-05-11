import { randomUUID } from "node:crypto";
import path from "node:path";
import { getConfig, type Config } from "./config";
import { getDb, runMigrations, type DB } from "./db/client";
import { getSseBus, SseBus } from "./jobs/sse-bus";
import { getJobQueue, type JobQueue } from "./jobs/queue";
import { getTextProvider, getImageProvider } from "./providers/factory";
import type { TextProvider, ImageProvider } from "./providers/types";
import { jobs } from "./db/schema";
import { runJob, type JobContext } from "./jobs/runner";

export interface Runtime {
  cfg: Config;
  db: DB;
  bus: SseBus;
  queue: JobQueue;
  text: TextProvider;
  image: ImageProvider;
  storageRoot: string;
}

let _runtime: Runtime | null = null;
let _migrated = false;
/**
 * 获取全局单例
 */
export async function getRuntime(): Promise<Runtime> {
  if (_runtime) return _runtime;
  const cfg = getConfig();
  const db = getDb();
  if (!_migrated) {
    await runMigrations(db);
    _migrated = true;
  }
  _runtime = {
    cfg,
    db,
    bus: getSseBus(),
    queue: getJobQueue(cfg.jobConcurrency),
    text: getTextProvider(cfg),
    image: getImageProvider(cfg),
    storageRoot: path.resolve(process.cwd(), cfg.storageDir),
  };
  return _runtime;
}

export async function startJob(args: {
  rt: Runtime;
  storyId: string;
  kind: typeof jobs.$inferInsert.kind;
  targetId?: string;
  fn: (ctx: JobContext) => Promise<unknown>;
}): Promise<string> {
  // 生成 job id，向 job 表里插入一条记录
  const id = randomUUID();
  args.rt.db
    .insert(jobs)
    .values({
      id,
      storyId: args.storyId,
      kind: args.kind,
      targetId: args.targetId ?? null,
    })
    .run();
  // void 显示忽略 runJob 返回的 Promise，不用等它执行完直接返回
  void runJob({
    db: args.rt.db,
    queue: args.rt.queue,
    bus: args.rt.bus,
    jobId: id,
    fn: args.fn,
  }).catch(() => {
    /* runner already records error */
  });
  return id;
}
