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
});

// Parse drizzle/schema.ts naively: each `export const X = mysqlTable("name", { ... })` block
const text = fs.readFileSync('drizzle/schema.ts','utf8');
const tableBlockRe = /mysqlTable\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{([\s\S]*?)\n\}\s*[,)]/g;
const tables = {};
let m;
while ((m = tableBlockRe.exec(text)) !== null) {
  const name = m[1];
  const body = m[2];
  // each property line: "  colName: type(\"db_name\", ...)..."
  const cols = [];
  for (const line of body.split('\n')) {
    const cm = line.match(/^\s*(\w+):\s*\w+\(\s*["'`]([^"'`]+)["'`]/);
    if (cm) cols.push({ js: cm[1], db: cm[2] });
  }
  tables[name] = cols;
}

const dbName = url.pathname.replace(/^\//,'');
const [allTables] = await conn.query('SHOW TABLES');
const dbTables = new Set(allTables.map(r => Object.values(r)[0]));

let problems = 0;
for (const [tname, expected] of Object.entries(tables)) {
  if (!dbTables.has(tname)) {
    console.log(`[MISSING TABLE] ${tname}`);
    problems++;
    continue;
  }
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${tname}\``);
  const have = new Set(rows.map(r => r.Field));
  const missing = expected.filter(c => !have.has(c.db));
  if (missing.length) {
    problems++;
    console.log(`[GAP] ${tname}: missing ${missing.map(m=>m.db).join(', ')}`);
  }
}
console.log(`---total tables in schema: ${Object.keys(tables).length}; problems: ${problems}`);
await conn.end();
