import { createDb, runMigrations } from "../lib/db/client";
import { loadConfig } from "../lib/config";

const cfg = loadConfig();
const db = createDb(cfg.databaseUrl);
await runMigrations(db);
console.log("migrations applied");
