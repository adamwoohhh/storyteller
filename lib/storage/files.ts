import fs from "node:fs/promises";
import path from "node:path";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function extFromMime(mime: string): string {
  const ext = MIME_TO_EXT[mime];
  if (!ext) throw new Error(`unsupported mime: ${mime}`);
  return ext;
}

export function resolveAssetPath(root: string, relPath: string): string {
  return path.join(root, relPath);
}

export async function saveAssetFile(args: {
  root: string;
  storyId: string;
  assetId: string;
  mime: string;
  bytes: Buffer;
}): Promise<string> {
  const ext = extFromMime(args.mime);
  const dir = path.join(args.root, args.storyId);
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join(args.storyId, `${args.assetId}.${ext}`);
  await fs.writeFile(path.join(args.root, rel), args.bytes);
  return rel;
}

export async function readAssetFile(root: string, relPath: string): Promise<Buffer> {
  return fs.readFile(resolveAssetPath(root, relPath));
}

export async function deleteAssetFile(root: string, relPath: string): Promise<void> {
  await fs.rm(resolveAssetPath(root, relPath), { force: true });
}
