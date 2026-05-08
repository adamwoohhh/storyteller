import pLimit from "p-limit";

export type JobFn = (signal: AbortSignal) => Promise<void>;

export class JobQueue {
  private limit: ReturnType<typeof pLimit>;
  private controllers = new Map<string, AbortController>();
  constructor(opts: { concurrency: number }) {
    this.limit = pLimit(opts.concurrency);
  }

  enqueue(id: string, fn: JobFn): Promise<void> {
    const ctrl = new AbortController();
    this.controllers.set(id, ctrl);
    return this.limit(async () => {
      try {
        await fn(ctrl.signal);
      } finally {
        this.controllers.delete(id);
      }
    });
  }

  cancel(id: string): void {
    const c = this.controllers.get(id);
    if (c) c.abort(new Error("aborted"));
  }
}

let _queue: JobQueue | null = null;
export function getJobQueue(concurrency: number): JobQueue {
  if (!_queue) _queue = new JobQueue({ concurrency });
  return _queue;
}
