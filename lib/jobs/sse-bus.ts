export type SseEvent =
  | { type: "chunk"; data: string }
  | { type: "progress"; data: { current: number; total: number; note?: string; nodeId?: string } }
  | { type: "done"; data: unknown }
  | { type: "error"; data: { message: string } };

type Listener = (e: SseEvent) => void;

/**
 * 发布订阅管理器
 * @method subscribe 订阅指定 jobId 的事件，如果有缓存的事件会直接消费，返回一个取消订阅的函数
 * @method publish 发布事件到指定 jobId 的订阅者，如果当前没有订阅者，则把事件缓存起来，等有订阅者时再推送
 * @method end 结束指定 jobId 的事件流，清除订阅者和缓存的事件
 */
export class SseBus {
  private listeners = new Map<string, Set<Listener>>();
  private buffers = new Map<string, SseEvent[]>();

  subscribe(jobId: string, fn: Listener): () => void {
    let set = this.listeners.get(jobId);
    if (!set) {
      set = new Set();
      this.listeners.set(jobId, set);
    }
    set.add(fn);
    // 检查是否有缓存的事件，如果有的话先推送给新订阅者
    const buffered = this.buffers.get(jobId);
    if (buffered) {
      this.buffers.delete(jobId);
      for (const e of buffered) fn(e);
    }
    return () => {
      const s = this.listeners.get(jobId);
      if (s) {
        s.delete(fn);
        if (s.size === 0) this.listeners.delete(jobId);
      }
    };
  }

  publish(jobId: string, event: SseEvent): void {
    const set = this.listeners.get(jobId);
    if (set && set.size > 0) {
      for (const fn of set) fn(event);
      return;
    }
    // 当前 job 没有订阅者，先把事件缓存起来，等有订阅者时再推送
    const buf = this.buffers.get(jobId) ?? [];
    buf.push(event);
    this.buffers.set(jobId, buf);
  }

  end(jobId: string): void {
    this.listeners.delete(jobId);
    this.buffers.delete(jobId);
  }
}

let _bus: SseBus | null = null;
export function getSseBus(): SseBus {
  if (!_bus) _bus = new SseBus();
  return _bus;
}
