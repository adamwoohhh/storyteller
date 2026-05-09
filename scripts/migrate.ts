import { createDb, runMigrations } from "../lib/db/client";
import { loadConfig } from "../lib/config";

async function main() {
  const cfg = loadConfig();
  const db = createDb(cfg.databaseUrl);
  await runMigrations(db);
  console.log("migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
