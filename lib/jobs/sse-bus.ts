export type SseEvent =
  | { type: "chunk"; data: string }
  | { type: "progress"; data: { current: number; total: number; note?: string } }
  | { type: "done"; data: unknown }
  | { type: "error"; data: { message: string } };

type Listener = (e: SseEvent) => void;

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
