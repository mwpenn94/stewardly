-- 0050: organizations white-label columns (logoUrl, customDomain, themeColor)
-- Already applied to live DB on 2026-05-07 via direct ALTER (idempotent: ER_DUP_FIELDNAME on rerun).
-- Schema-only no-op marker preserved so the meta snapshot stays consistent.
SELECT 1;
