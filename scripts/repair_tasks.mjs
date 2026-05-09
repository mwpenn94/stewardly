import mysql from 'mysql2/promise';
import fs from 'fs';
const dburl = process.env.DATABASE_URL;
if (!dburl) throw new Error('DATABASE_URL missing');
const url = new URL(dburl);
const conn = await mysql.createConnection({
  host: url.hostname, port: Number(url.port||3306),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//,''),
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});
async function exec(sql, label){
  try { await conn.query(sql); console.log('[ok]', label); }
  catch (e) { console.log('[err]', label, '->', e.message); }
}
await exec('DROP TABLE IF EXISTS tasks', 'drop tasks');
const files = [
  'drizzle/0001_wealthy_thanos.sql',
  'drizzle/0004_closed_paibok.sql',
  'drizzle/0007_sturdy_bloodscream.sql',
  'drizzle/0008_tense_dragon_lord.sql',
  'drizzle/0018_smiling_karma.sql',
  'drizzle/0024_gorgeous_marauders.sql',
  'drizzle/0025_strange_electro.sql',
  'drizzle/0033_peaceful_darwin.sql',
  'drizzle/0035_early_mesmero.sql',
];
for (const f of files) {
  const sql = fs.readFileSync(f,'utf8');
  const stmts = sql.split(/-->\s*statement-breakpoint|;\s*$/m).map(s=>s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    if (!/tasks/.test(stmt)) continue;
    if (/^CREATE TABLE/i.test(stmt) || /^ALTER TABLE/i.test(stmt) || /^CREATE INDEX/i.test(stmt) || /^DROP INDEX/i.test(stmt) || /^CREATE UNIQUE INDEX/i.test(stmt)) {
      await exec(stmt, f.split('/').pop() + ': ' + stmt.slice(0,80).replace(/\n/g,' '));
    }
  }
}
const [rows] = await conn.query('SHOW COLUMNS FROM tasks');
console.log('---final columns---');
console.log(rows.map(r=>r.Field).join(', '));
await conn.end();
