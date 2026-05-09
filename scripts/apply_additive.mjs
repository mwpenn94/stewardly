import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
const u = new URL(url.replace('mysql://','http://'));
const conn = await mysql.createConnection({
  host: u.hostname, port: parseInt(u.port||'3306',10),
  user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//,''),
  ssl:{rejectUnauthorized:false}, multipleStatements:true,
});
const dir='/home/ubuntu/stewardly-v3/drizzle/_stewardly_additive';
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort();
let ok=0, fail=0;
for (const f of files) {
  const sql = fs.readFileSync(path.join(dir,f),'utf-8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
  for (const stmt of sql) {
    try { await conn.query(stmt); }
    catch(e) {
      const msg=String(e.message||'');
      if (msg.includes('already exists')||msg.includes('Duplicate')||msg.includes("doesn't exist")) continue;
      fail++; console.error('FAIL',f,msg.slice(0,200));
    }
  }
  console.log('applied', f);
  ok++;
}
const [rows] = await conn.query("SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME");
console.log('tables=', rows.length);
const names = rows.map(r=>r.TABLE_NAME).filter(n=>['users','scheduled_tasks','engines_log','vault_credentials','automation_schedules','connector_health'].includes(n));
console.log('key_tables_present=', names.sort().join(','));
console.log('DONE applied='+ok,'fail='+fail);
await conn.end();
