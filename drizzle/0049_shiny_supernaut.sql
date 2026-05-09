-- Migration 0049 — declares 6 5-layer architecture tables already present in
-- live DB from prior _stewardly_additive migrations (organizations,
-- user_organization_roles, platform_ai_settings, organization_ai_settings,
-- manager_ai_settings, professional_ai_settings). No-op so meta snapshot
-- becomes the comparison baseline for future schema changes.
SELECT 1;
