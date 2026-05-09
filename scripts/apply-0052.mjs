#!/usr/bin/env node
/**
 * Apply drizzle migration 0052 directly via mysql2 with error-tolerance.
 *
 * drizzle-kit migrate hangs on this 6502-line additive migration (likely
 * because it tries to wrap all 392 CREATE TABLE statements in a single
 * transaction and the InnoDB undo buffer can't handle it). This script
 * splits the migration on `--> statement-breakpoint` and runs each
 * statement independently, skipping "table already exists" errors so it
 * is idempotent and safe to re-run.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const MIGRATION_FILE = path.resolve(
  process.cwd(),
  "drizzle/0052_spicy_anita_blake.sql",
);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

console.log(`Reading ${MIGRATION_FILE}…`);
const sql = await readFile(MIGRATION_FILE, "utf8");

// drizzle-kit emits each statement separated by `--> statement-breakpoint`
const statements = sql
  .split(/-->\s*statement-breakpoint/g)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Found ${statements.length} statements to apply.`);

console.log("Connecting…");
const conn = await mysql.createConnection({
  uri: url,
  multipleStatements: false,
  // Short timeout so we don't hang
  connectTimeout: 30_000,
});

let applied = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    await conn.query(stmt);
    applied += 1;
    if ((i + 1) % 25 === 0) {
      console.log(`  [${i + 1}/${statements.length}] applied (running total: ${applied} applied / ${skipped} skipped / ${failed} failed)`);
    }
  } catch (err) {
    const msg = String(err?.message || err);
    if (
      msg.includes("already exists") ||
      msg.includes("Duplicate key name") ||
      msg.includes("ER_TABLE_EXISTS_ERROR") ||
      msg.includes("ER_DUP_KEYNAME")
    ) {
      skipped += 1;
    } else {
      failed += 1;
      // First few words of statement for diagnosis
      const head = stmt.slice(0, 80).replace(/\s+/g, " ");
      console.error(`  [${i + 1}] FAILED: ${head}…`);
      console.error(`         ${msg}`);
    }
  }
}

console.log("");
console.log("=== Migration apply complete ===");
console.log(`  Applied: ${applied}`);
console.log(`  Skipped (already exists): ${skipped}`);
console.log(`  Failed (other error): ${failed}`);

await conn.end();

if (failed > 0) {
  console.error("Some statements failed; review output above.");
  process.exit(1);
}

// Mark the migration as applied in drizzle's __drizzle_migrations table so
// drizzle-kit doesn't try to re-run it.
const conn2 = await mysql.createConnection({ uri: url, connectTimeout: 30_000 });
try {
  // Drizzle's tracking table
  await conn2.query(`
    CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`hash\` varchar(255) NOT NULL,
      \`created_at\` bigint
    )
  `);
  // Hash for migration 0052 — drizzle uses sha256 of the file
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(sql).digest("hex");
  // Check if already recorded
  const [existing] = await conn2.query(
    "SELECT id FROM `__drizzle_migrations` WHERE `hash` = ? LIMIT 1",
    [hash],
  );
  if (Array.isArray(existing) && existing.length > 0) {
    console.log("Migration already recorded in __drizzle_migrations.");
  } else {
    await conn2.query(
      "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
      [hash, Date.now()],
    );
    console.log(`Recorded migration in __drizzle_migrations (hash ${hash.slice(0, 12)}…).`);
  }
} finally {
  await conn2.end();
}

console.log("Done.");
