/**
 * Direct mysql2 connection accessor for the engines module.
 *
 * The foundation already exposes a Drizzle wrapper in `server/db.ts`, but
 * the engine-side adapters do small targeted INSERT/SELECTs against the
 * SAI-only tables (aegis_cache, atlas_*, etc.) that aren't yet modeled in
 * the Drizzle schema. Going direct keeps the engine module fast and
 * decoupled from schema drift while we ladder Drizzle types in.
 */
import mysql from "mysql2/promise";

let _conn: mysql.Connection | null = null;

export async function mysqlConn(): Promise<mysql.Connection | null> {
  if (_conn) return _conn;
  const dsn = process.env.DATABASE_URL;
  if (!dsn) return null;
  try {
    _conn = await mysql.createConnection({
      uri: dsn,
      ssl: { rejectUnauthorized: false },
    });
    return _conn;
  } catch {
    return null;
  }
}
