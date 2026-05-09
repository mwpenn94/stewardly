import mysql from 'mysql2/promise';
import fs from 'fs';
const env = fs.readFileSync('.env','utf8').split('\n').reduce((a,l)=>{const m=l.match(/^([^=#]+)=(.*)$/);if(m)a[m[1].trim()]=m[2].replace(/^"|"$/g,'');return a;},{});
const url = new URL(env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: Number(url.port||3306),
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//,''),
  ssl: { rejectUnauthorized: false },
});
const [rows] = await conn.query('SHOW COLUMNS FROM tasks');
console.log('--- actual tasks columns ---');
console.log(rows.map(r => r.Field).join('\n'));
await conn.end();
