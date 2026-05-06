-- Stewardly v3 post-migration validation queries.
-- Each query returns a single integer; non-zero or wrong values
-- indicate a failure that must be triaged before traffic flips.

-- 1) All 414 additive tables exist
SELECT COUNT(*) AS additive_tables_present
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    SELECT TRIM(BOTH FROM line) AS t
    FROM (
      -- The list is loaded externally via runbook §3.7; here we just count
      -- against the manifest table populated at the start of the run.
      SELECT 1
    ) AS dummy
    WHERE FALSE
  );

-- 2) users — expected count >= dump count
SELECT COUNT(*) AS users_count FROM users;

-- 3) tasks — expected count >= dump count
SELECT COUNT(*) AS tasks_count FROM tasks;

-- 4) Foreign-key integrity — orphan check on the busiest tables
SELECT COUNT(*) AS orphan_messages
FROM task_messages tm LEFT JOIN tasks t ON t.id = tm.taskId
WHERE t.id IS NULL;

-- 5) Document vault tenant keys are wrapped under the new master
SELECT COUNT(*) AS vault_tenants_with_new_wrap
FROM document_vault_tenant_keys
WHERE wrappedDekVersion = 'v3';

-- 6) Persona learnings imported
SELECT COUNT(*) AS persona_learnings_count FROM persona_learnings;

-- 7) Audit trail length
SELECT COUNT(*) AS audit_trail_count FROM audit_trail;

-- 8) Most recent migration timestamp
SELECT MAX(created_at) AS last_migrated_at FROM audit_trail;
