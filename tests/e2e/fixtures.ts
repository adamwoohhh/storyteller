import { test as base } from "@playwright/test";
import fs from "node:fs";

export const test = base.extend({});
export { expect } from "@playwright/test";

export function resetE2EData() {
  fs.rmSync("./data/e2e.db", { force: true });
  fs.rmSync("./data/e2e.db-shm", { force: true });
  fs.rmSync("./data/e2e.db-wal", { force: true });
  fs.rmSync("./data/e2e-images", { recursive: true, force: true });
}
