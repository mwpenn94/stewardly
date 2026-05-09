/**
 * S3-backed encrypted document vault.
 * Per-tenant prefix; uses the foundation's storage layer (server/storage.ts).
 *
 * The "encryption" guarantee here is delivered by the platform's S3 server-side
 * encryption (SSE-S3) — we do not roll our own key wrapping. The Phase 3 doc
 * vault migration script (migrations/scripts/12_migrate_document_vault.py) is
 * responsible for re-encrypting existing artifacts under the platform's KMS key
 * if you ever migrate from a legacy bucket.
 */
import { storagePut } from "../storage";
import { mysqlConn } from "./_core_shim/db";

export type VaultPutResult = {
  documentId: number | null;
  key: string;
  url: string;
};

export async function vaultPut(opts: {
  tenantId: string;
  filename: string;
  bytes: Buffer | Uint8Array | string;
  mimeType: string;
}): Promise<VaultPutResult> {
  const safe = opts.filename.replace(/[^\w.\-]/g, "_");
  const ts = Date.now();
  const relKey = `vault/${opts.tenantId}/${ts}-${safe}`;

  const { key, url } = await storagePut(relKey, opts.bytes, opts.mimeType);

  // Best-effort metadata write to the SAI documents table; if the schema isn't
  // present, the file is still in S3 and recoverable by key.
  let documentId: number | null = null;
  const conn = await mysqlConn();
  if (conn) {
    try {
      const [r] = (await conn.query(
        `INSERT INTO documents
           (user_id, file_url, file_key, file_name, mime_type, file_size, created_at)
         VALUES (NULL, ?, ?, ?, ?, ?, NOW())`,
        [url, key, safe, opts.mimeType, typeof opts.bytes === "string" ? opts.bytes.length : opts.bytes.byteLength],
      )) as [{ insertId: number }, unknown];
      documentId = r.insertId;
    } catch {
      // documents table schema may not match; metadata write is best-effort.
    }
  }

  return { documentId, key, url };
}
