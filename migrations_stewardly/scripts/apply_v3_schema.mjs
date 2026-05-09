/**
 * apply_v3_schema.mjs
 *
 * Apply the additive Phase 3 schema (414 CREATE TABLE + 79 ADD COLUMN)
 * to the project's managed MySQL/TiDB instance via mysql2.
 *
 * Run with: node migrations/scripts/apply_v3_schema.mjs
 *
 * Reads DATABASE_URL from the environment.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import mysql from "mysql2/promise";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const DSN = process.env.DATABASE_URL;
if (!DSN) {
  console.error("DATABASE_URL not set");
  process.exit(2);
}

// mysql2 supports DSN URI directly via createConnection({ uri: ... })
const conn = await mysql.createConnection({
  uri: DSN,
  multipleStatements: true,
  ssl: { rejectUnauthorized: false },
});

// Tolerable error codes for an idempotent additive migration
const TOLERABLE_CODES = new Set([
  "ER_TABLE_EXISTS_ERROR",         // 1050
  "ER_DUP_KEYNAME",                 // 1061
  "ER_DUP_FIELDNAME",               // 1060
  "ER_DUP_ENTRY",                   // 1062
  "ER_CANT_CREATE_TABLE",           // 1005 (sometimes from FK to absent table; not fatal here)
]);
const TOLERABLE_MESSAGES = [
  "Duplicate key name",
  "Duplicate column name",
  "already exists",
];

function isTolerable(err) {
  if (!err) return false;
  if (err.code && TOLERABLE_CODES.has(err.code)) return true;
  const msg = String(err.sqlMessage || err.message || "");
  return TOLERABLE_MESSAGES.some((m) => msg.includes(m));
}

function splitStatements(sql) {
  // Naive splitter on top-level semicolons. Drizzle output doesn't use
  // semicolons inside column DEFAULTs in our generated SQL.
  const out = [];
  let buf = "";
  let inSq = false, inDq = false, inBt = false;
  for (const ch of sql) {
    if (ch === "'" && !inDq && !inBt) inSq = !inSq;
    else if (ch === '"' && !inSq && !inBt) inDq = !inDq;
    else if (ch === "`" && !inSq && !inDq) inBt = !inBt;
    if (ch === ";" && !inSq && !inDq && !inBt) {
      const s = buf.trim();
      if (s) out.push(s);
      buf = "";
    } else {
      buf += ch;
    }
  }
  const s = buf.trim();
  if (s) out.push(s);
  return out;
}

async function applyFile(p) {
  const sql = fs.readFileSync(p, "utf8");
  const stmts = splitStatements(sql);
  const t0 = Date.now();
  let ok = 0, skipped = 0, fatal = 0;
  for (const stmt of stmts) {
    try {
      await conn.query(stmt);
      ok++;
    } catch (err) {
      if (isTolerable(err)) {
        skipped++;
      } else {
        fatal++;
        console.error(`  ✗ ${err.code || ""} ${err.sqlMessage || err.message}`);
        console.error(`    stmt head: ${stmt.slice(0, 120).replace(/\s+/g, " ")}\u2026`);
      }
    }
  }
  const ms = Date.now() - t0;
  console.log(
    `  ✓ ${path.basename(p)} — ${stmts.length} stmts, ${ok} ok, ${skipped} skipped (idempotent), ${fatal} fatal (${ms}ms)`,
  );
  return { ok, skipped, fatal };
}

console.log("=== Stewardly v3 schema migration ===");

// Phase A0: foundation tables (tasks, user_preferences) carried over from
// the standalone manus-next-app foundation. The webdev scaffold ships with
// only `users`, but our additive ALTERs reference these two tables.
console.log("Phase A0: foundation tables (tasks, user_preferences)");
await applyFile(path.join(ROOT, "drizzle/_additive/0048b_foundation_tables.sql"));

// Phase A: 14 chunks of CREATE TABLE IF NOT EXISTS
const chunkDir = path.join(ROOT, "drizzle/_additive/chunks");
const chunks = fs
  .readdirSync(chunkDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
console.log(`Phase A: applying ${chunks.length} chunks of CREATE TABLE statements`);
for (const c of chunks) {
  await applyFile(path.join(chunkDir, c));
}

// Phase B: ALTER TABLE ADD COLUMN IF NOT EXISTS
console.log("\nPhase B: applying 79 ADD COLUMN ALTERs");
await applyFile(path.join(ROOT, "drizzle/_additive/0050_v3_column_alters.sql"));

// Validation
console.log("\n=== Validation ===");
const [tablesRows] = await conn.query("SHOW TABLES");
const tableCount = tablesRows.length;
console.log(`Total tables in database: ${tableCount}`);

const [usersDesc] = await conn.query("SHOW COLUMNS FROM users");
console.log(`users columns: ${usersDesc.length}`);

const [tasksRows] = await conn.query(
  "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'tasks'",
);
if (tasksRows[0].c) {
  const [tasksDesc] = await conn.query("SHOW COLUMNS FROM tasks");
  console.log(`tasks columns: ${tasksDesc.length}`);
}

const [prefsRows] = await conn.query(
  "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_preferences'",
);
if (prefsRows[0].c) {
  const [prefsDesc] = await conn.query("SHOW COLUMNS FROM user_preferences");
  console.log(`user_preferences columns: ${prefsDesc.length}`);
}

await conn.end();
console.log("\n=== DONE ===");
