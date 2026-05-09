// Live (non-dry-run) smoke for the customer-state migration.
// Runs the python migrator against the managed DATABASE_URL with a tiny synthetic
// dump that touches only the OVERLAP `users` row id=1 (existing) so the only
// observable effect on the DB is `ON DUPLICATE KEY UPDATE id=id` (no-op).
//
// Usage:  pnpm exec tsx scripts/customer_migration_smoke.mjs
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set; aborting.");
  process.exit(2);
}

mkdirSync("/tmp/sai", { recursive: true });
const dumpPath = "/tmp/sai/mini2.sql";
writeFileSync(
  dumpPath,
  // OVERLAP table → ON DUPLICATE KEY UPDATE id=id (no-op)
  "INSERT INTO `users` (`id`,`name`,`email`,`createdAt`,`updatedAt`,`role`,`openId`,`loginMethod`) " +
    "VALUES (1,'alice','a@example.com','2026-01-01 00:00:00','2026-01-01 00:00:00','user','oid-1','manus');\n"
);

console.log("[migration-smoke] DATABASE_URL host:", new URL(url).host);
const proc = spawnSync(
  "python3",
  [
    "migrations/scripts/10_migrate_customer_state.py",
    "--dump",
    dumpPath,
    "--target-url",
    url,
  ],
  { stdio: "inherit" }
);
process.exit(proc.status ?? 1);
