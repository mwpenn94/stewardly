import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const u = new URL(url.replace('mysql://', 'http://'));
const conn = await mysql.createConnection({
  host: u.hostname,
  port: parseInt(u.port || '3306', 10),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

const dir = '/home/ubuntu/stewardly-v3/drizzle';
const files = fs.readdirSync(dir).filter(f => /^\d{4}.*\.sql$/.test(f)).sort();
let ok = 0, fail = 0;
for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf-8')
    .split('--> statement-breakpoint')
    .map(s => s.trim()).filter(Boolean);
  for (const stmt of sql) {
    try {
      await conn.query(stmt);
    } catch (e) {
      // Idempotent: ignore "already exists" / "duplicate"
      const msg = String(e.message || '');
      if (msg.includes('already exists') || msg.includes("Duplicate")) continue;
      fail++;
      console.error('FAIL', f, msg.slice(0, 200));
    }
  }
  ok++;
  if (ok % 8 === 0) console.log('applied', ok, '/', files.length);
}
console.log('DONE applied=' + ok, 'fail_stmts=' + fail);
await conn.end();
