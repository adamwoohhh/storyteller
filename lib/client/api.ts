async function jsonReq<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const api = {
  listStories: () => jsonReq<{ stories: Any[] }>("GET", "/api/stories"),
  createStory: (body: Any) => jsonReq<{ id: string }>("POST", "/api/stories", body),
  getStory: (id: string) => jsonReq<Any>("GET", `/api/stories/${id}`),
  patchStory: (id: string, body: Any) => jsonReq<Any>("PATCH", `/api/stories/${id}`, body),
  deleteStory: (id: string) => jsonReq<{ ok: true }>("DELETE", `/api/stories/${id}`),
  generateText: (id: string) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/generate-text`),
  reviseText: (id: string, revisePrompt: string) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/revise-text`, { revisePrompt }),
  extractCharacters: (id: string) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/extract-characters`),
  storyboard: (id: string, opts?: { targetMin?: number; targetMax?: number }) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/storyboard`, opts ?? {}),
  cds: (id: string, body: { artStyleKey: string; artStylePrompt: string }) =>
    jsonReq<{ jobId: string }>("POST", `/api/stories/${id}/cds`, body),
  renderCharacter: (cid: string) =>
    jsonReq<{ jobId: string }>("POST", `/api/characters/${cid}/render`),
  patchCharacter: (cid: string, body: Any) =>
    jsonReq<Any>("PATCH", `/api/characters/${cid}`, body),
  deleteCharacter: (cid: string) =>
    jsonReq<{ ok: true }>("DELETE", `/api/characters/${cid}`),
  patchNode: (nid: string, body: Any) => jsonReq<Any>("PATCH", `/api/nodes/${nid}`, body),
  deleteNode: (nid: string) => jsonReq<{ ok: true }>("DELETE", `/api/nodes/${nid}`),
  renderNode: (nid: string) => jsonReq<{ jobId: string }>("POST", `/api/nodes/${nid}/render`),
  renderAll: (id: string) =>
    jsonReq<{ jobId: string; total: number }>("POST", `/api/stories/${id}/render-all`),
  cancelJob: (jid: string) => jsonReq<{ ok: true }>("DELETE", `/api/jobs/${jid}`),
  uploadFile: async (storyId: string, file: File): Promise<{ assetId: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("storyId", storyId);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
