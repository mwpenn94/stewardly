CREATE TABLE IF NOT EXISTS `user_changelog_awareness` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`changelog_id` int NOT NULL,
	`informed_via` enum('ai_chat','notification','changelog_page','onboarding') NOT NULL,
	`informed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_changelog_awareness_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`consent_type` enum('ai_chat','voice_input','document_upload','data_sharing','marketing','analytics') NOT NULL,
	`granted` boolean NOT NULL DEFAULT false,
	`granted_at` bigint,
	`revoked_at` bigint,
	`version` varchar(20) NOT NULL DEFAULT '1.0',
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `user_consents_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_feature_proficiency` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`feature_key` varchar(128) NOT NULL,
	`feature_label` varchar(256) NOT NULL,
	`category` varchar(64) NOT NULL,
	`total_interactions` int NOT NULL DEFAULT 0,
	`total_duration_ms` bigint NOT NULL DEFAULT 0,
	`proficiency_score` float NOT NULL DEFAULT 0,
	`proficiency_level` enum('undiscovered','novice','familiar','proficient','expert') NOT NULL DEFAULT 'undiscovered',
	`first_used_at` timestamp,
	`last_used_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_feature_proficiency_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_guardrails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`guardrail_type` varchar(64) NOT NULL,
	`value` varchar(256) NOT NULL,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_guardrails_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_insights_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`insight_type` enum('people_performance','system_infrastructure','usage_optimization') NOT NULL,
	`layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`data` json NOT NULL,
	`summary` text NOT NULL,
	`computed_at` bigint NOT NULL,
	`expires_at` bigint NOT NULL,
	CONSTRAINT `user_insights_cache_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ghl_location_id` int NOT NULL,
	`access_level` enum('view','manage','admin') DEFAULT 'view',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_locations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`memory_category` enum('fact','preference','episodic','amp_engagement','ho_domain_trajectory') NOT NULL,
	`content` text,
	`confidence` decimal(3,2),
	`source` varchar(100),
	`session_id` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_memories_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_organization_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`globalRole` enum('global_admin','user') DEFAULT 'user',
	`organizationRole` enum('org_admin','manager','professional','user') DEFAULT 'user',
	`managerId` int,
	`professionalId` int,
	`status` enum('active','inactive','invited','pending_approval') DEFAULT 'active',
	`invitedAt` timestamp,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_organization_roles_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_platform_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`feature_key` varchar(128) NOT NULL,
	`metadata` json,
	`session_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_platform_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`zipCode` varchar(10),
	`jobTitle` varchar(128),
	`incomeRange` varchar(64),
	`savingsRange` varchar(64),
	`familySituation` varchar(128),
	`lifeStage` varchar(64),
	`goals` json,
	`sharedContext` json,
	`insuranceSummary` json,
	`investmentSummary` json,
	`estateExposure` json,
	`businessOwner` boolean DEFAULT false,
	`focusPreference` enum('general','financial','both') DEFAULT 'both',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`relatedUserId` int NOT NULL,
	`relationshipType` enum('manager','team_member','mentor','mentee','peer','client','advisor','colleague') NOT NULL,
	`organizationId` int,
	`status` enum('active','inactive','pending') DEFAULT 'active',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_relationships_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `verification_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`verification_source` enum('finra_brokercheck','sec_iapd','cfp_board','nasba_cpaverify','nipr_pdb','nmls','state_bar','ibba','martindale','avvo') NOT NULL,
	`frequency_days` int NOT NULL DEFAULT 30,
	`last_run_at` bigint,
	`next_run_at` bigint NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verification_schedules_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `video_streaming_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`conversation_id` int,
	`stream_type` enum('screen_share','camera','co_browse') NOT NULL,
	`stream_status` enum('connecting','active','paused','ended') DEFAULT 'connecting',
	`started_at` timestamp DEFAULT (now()),
	`ended_at` timestamp,
	`transcript_text` text,
	`ai_responses_during_stream` int DEFAULT 0,
	CONSTRAINT `video_streaming_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `view_as_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`organizationId` int,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`actions` json,
	`reason` text,
	`sessionDuration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `view_as_audit_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `view_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`view_name` varchar(200) NOT NULL,
	`view_type` varchar(50) NOT NULL,
	`view_config` json NOT NULL,
	`owner_id` int NOT NULL,
	`shared_with_user_id` int,
	`shared_with_org_id` int,
	`shared_with_role` enum('user','advisor','manager','admin'),
	`permission_level` enum('view','edit') NOT NULL DEFAULT 'view',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `view_shares_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `wealth_hub_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`hub_type` varchar(30) NOT NULL,
	`label` varchar(100) NOT NULL,
	`allocations` json NOT NULL,
	`input_overrides` json,
	`is_default` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `wealth_hub_allocations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `web_scrape_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataSourceId` int,
	`ingestionJobId` int,
	`url` varchar(2000) NOT NULL,
	`pageTitle` varchar(500),
	`contentText` text,
	`extractedEntities` json,
	`extractedMetrics` json,
	`scrapeStatus` enum('success','partial','failed') DEFAULT 'success',
	`httpStatus` int,
	`contentHash` varchar(64),
	`scrapedAt` bigint NOT NULL,
	CONSTRAINT `web_scrape_results_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `weight_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`description` varchar(500),
	`weights` json NOT NULL,
	`optimized_for` json,
	`is_built_in` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weight_presets_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workflow_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workflowType` enum('professional_onboarding','client_onboarding','licensing','registration') NOT NULL,
	`steps` json NOT NULL,
	`currentStep` int DEFAULT 0,
	`status` enum('not_started','in_progress','completed','paused') DEFAULT 'not_started',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_checklist_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workflow_checkpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflow_id` int NOT NULL,
	`agent_run_id` int,
	`step_index` int NOT NULL DEFAULT 0,
	`step_name` varchar(255),
	`state` json,
	`status` enum('saved','restored','compensating','compensated','failed') NOT NULL DEFAULT 'saved',
	`compensation_action` text,
	`retry_count` int NOT NULL DEFAULT 0,
	`max_retries` int NOT NULL DEFAULT 3,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_checkpoints_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workflow_event_chains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`actions_json` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_event_chains_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workflow_execution_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chain_id` int NOT NULL,
	`event_source` varchar(256),
	`triggered_at` timestamp DEFAULT (now()),
	`actions_executed` int DEFAULT 0,
	`actions_failed` int DEFAULT 0,
	`result_json` text,
	`status` enum('running','completed','failed','partial') DEFAULT 'running',
	CONSTRAINT `workflow_execution_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workflow_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`template_id` varchar(128) NOT NULL,
	`template_name` varchar(255),
	`state_json` json NOT NULL,
	`current_step` int NOT NULL DEFAULT 0,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_instances_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `zip_code_demographics` (
	`zip` varchar(10) NOT NULL,
	`city` varchar(100),
	`county` varchar(100),
	`state` varchar(2),
	`latitude` decimal(9,6),
	`longitude` decimal(9,6),
	`num_returns` int,
	`avg_agi` decimal(12,2),
	`pct_returns_over_200k` decimal(5,2),
	`total_population` int,
	`median_household_income` decimal(12,2),
	`median_age` decimal(4,1),
	`homeownership_rate` decimal(5,2),
	`wealth_index` decimal(5,2),
	CONSTRAINT `zip_code_demographics_zip` PRIMARY KEY(`zip`)
);

CREATE INDEX `idx_ad_impression_ad` ON `ad_impression_log` (`ad_id`);
CREATE INDEX `idx_ad_impression_user` ON `ad_impression_log` (`user_id`);
CREATE INDEX `idx_advisory_executions_client_id` ON `advisory_executions` (`clientId`);
CREATE INDEX `idx_advisory_executions_professional_id` ON `advisory_executions` (`professionalId`);
CREATE INDEX `idx_advisory_executions_gate_review_id` ON `advisory_executions` (`gateReviewId`);
CREATE INDEX `idx_advisory_executions_reviewer_id` ON `advisory_executions` (`reviewerId`);
CREATE INDEX `idx_affiliated_resources_organization_id` ON `affiliated_resources` (`organizationId`);
CREATE INDEX `idx_agent_actions_agent_instance_id` ON `agent_actions` (`agentInstanceId`);
CREATE INDEX `idx_agent_autonomy_levels_agent_template_id` ON `agent_autonomy_levels` (`agent_template_id`);
CREATE INDEX `idx_agent_instances_user_id` ON `agent_instances` (`userId`);
CREATE INDEX `idx_agent_instances_firm_id` ON `agent_instances` (`firmId`);
CREATE INDEX `idx_agent_performance_agent_template_id` ON `agent_performance` (`agent_template_id`);
CREATE INDEX `idx_agent_templates_org_id` ON `agent_templates` (`org_id`);
CREATE INDEX `idx_ai_response_quality_user_id` ON `ai_response_quality` (`user_id`);
CREATE INDEX `idx_ai_response_quality_conversation_id` ON `ai_response_quality` (`conversation_id`);
CREATE INDEX `idx_ai_response_quality_message_id` ON `ai_response_quality` (`message_id`);
CREATE INDEX `idx_ai_tool_calls_tool_id` ON `ai_tool_calls` (`tool_id`);
CREATE INDEX `idx_ai_tool_calls_conversation_id` ON `ai_tool_calls` (`conversation_id`);
CREATE INDEX `idx_ai_tool_calls_message_id` ON `ai_tool_calls` (`message_id`);
CREATE INDEX `idx_ai_tool_calls_user_id` ON `ai_tool_calls` (`user_id`);
CREATE INDEX `idx_ai_tool_executions_user_id` ON `ai_tool_executions` (`user_id`);
CREATE INDEX `idx_ai_tool_executions_conversation_id` ON `ai_tool_executions` (`conversation_id`);
CREATE INDEX `idx_ai_tool_executions_message_id` ON `ai_tool_executions` (`message_id`);
CREATE INDEX `idx_annual_reviews_client_id` ON `annual_reviews` (`client_id`);
CREATE INDEX `idx_annual_reviews_professional_id` ON `annual_reviews` (`professional_id`);
CREATE INDEX `idx_as_user` ON `assessment_sessions` (`user_id`);
CREATE INDEX `idx_as_status` ON `assessment_sessions` (`status`);
CREATE INDEX `idx_as_user_status` ON `assessment_sessions` (`user_id`,`status`);
CREATE INDEX `idx_audio_content` ON `audio_scripts` (`content_type`,`content_id`);
CREATE INDEX `idx_asp_user_track` ON `audio_study_progress` (`user_id`,`track_slug`);
CREATE INDEX `idx_asp_completed` ON `audio_study_progress` (`completed_at`);
CREATE INDEX `idx_asp_due_review` ON `audio_study_progress` (`user_id`,`next_review_at`);
CREATE INDEX `idx_audit_trail_user_id` ON `audit_trail` (`userId`);
CREATE INDEX `idx_audit_trail_conversation_id` ON `audit_trail` (`conversationId`);
CREATE INDEX `idx_audit_trail_message_id` ON `audit_trail` (`messageId`);
CREATE INDEX `idx_auth_enrichment_log_user_id` ON `auth_enrichment_log` (`user_id`);
CREATE INDEX `idx_auth_provider_tokens_user_id` ON `auth_provider_tokens` (`user_id`);
CREATE INDEX `idx_benchmark_comparisons_client` ON `benchmark_comparisons` (`clientId`);
CREATE INDEX `idx_benchmark_comparisons_type` ON `benchmark_comparisons` (`comparisonType`);
CREATE INDEX `idx_benchmark_comparisons_snapshot` ON `benchmark_comparisons` (`snapshotDate`);
CREATE INDEX `idx_beneficiary_reviews_client` ON `beneficiary_reviews` (`clientId`);
CREATE INDEX `idx_beneficiary_reviews_advisor` ON `beneficiary_reviews` (`advisorId`);
CREATE INDEX `idx_beneficiary_reviews_status` ON `beneficiary_reviews` (`status`);
CREATE INDEX `idx_beneficiary_reviews_next_review` ON `beneficiary_reviews` (`nextReviewDate`);
CREATE INDEX `idx_billing_events_user_id` ON `billing_events` (`user_id`);
CREATE INDEX `idx_billing_events_stripe_event_id` ON `billing_events` (`stripe_event_id`);
CREATE INDEX `idx_billing_events_event_type` ON `billing_events` (`event_type`);
CREATE INDEX `idx_browser_sessions_user_id` ON `browser_sessions` (`user_id`);
CREATE INDEX `idx_browser_sessions_agent_run_id` ON `browser_sessions` (`agent_run_id`);
CREATE INDEX `idx_browser_sessions_user_created_at` ON `browser_sessions` (`user_id`,`created_at`);
CREATE INDEX `idx_business_exit_plans_user_id` ON `business_exit_plans` (`user_id`);
CREATE INDEX `idx_cca_user` ON `cadence_compliance_audit` (`user_id`);
CREATE INDEX `idx_cca_type` ON `cadence_compliance_audit` (`audit_type`);
CREATE INDEX `idx_cca_grade` ON `cadence_compliance_audit` (`grade`);
CREATE INDEX `idx_ce_user_lead` ON `cadence_enrollments` (`user_id`,`lead_id`);
CREATE INDEX `idx_ce_status` ON `cadence_enrollments` (`cadence_status`);
CREATE INDEX `idx_ce_next_touch` ON `cadence_enrollments` (`next_touch_due_at`);
CREATE INDEX `idx_cor_user_lead` ON `cadence_opt_out_registry` (`user_id`,`lead_id`);
CREATE INDEX `idx_cor_opt_out_at` ON `cadence_opt_out_registry` (`opt_out_at`);
CREATE INDEX `idx_ctl_enrollment` ON `cadence_touch_log` (`enrollment_id`);
CREATE INDEX `idx_ctl_user_lead` ON `cadence_touch_log` (`user_id`,`lead_id`);
CREATE INDEX `idx_ctl_status` ON `cadence_touch_log` (`touch_status`);
CREATE INDEX `idx_ctl_sent_at` ON `cadence_touch_log` (`sent_at`);
CREATE INDEX `idx_calc_cache_session` ON `calculator_result_cache` (`session_id`,`calculator_type`);
CREATE INDEX `idx_calc_cache_hash` ON `calculator_result_cache` (`inputs_hash`);
CREATE INDEX `idx_calculator_scenarios_user_id` ON `calculator_scenarios` (`user_id`);
CREATE INDEX `idx_cr_user_item` ON `card_reviews` (`user_id`,`item_key`);
CREATE INDEX `idx_cr_user_date` ON `card_reviews` (`user_id`,`reviewed_at`);
CREATE INDEX `idx_cr_flag` ON `card_reviews` (`feature_flag`);
CREATE INDEX `idx_cs_user_item` ON `card_schedules` (`user_id`,`item_key`,`item_type`);
CREATE INDEX `idx_cs_user_due` ON `card_schedules` (`user_id`,`next_due`);
CREATE INDEX `idx_cs_flag` ON `card_schedules` (`feature_flag`);
CREATE INDEX `idx_carrier_connections_firm_id` ON `carrier_connections` (`firmId`);
CREATE INDEX `idx_carrier_submissions_quote_id` ON `carrier_submissions` (`quote_id`);
CREATE INDEX `idx_carrier_submissions_carrier_id` ON `carrier_submissions` (`carrier_id`);
CREATE INDEX `idx_ce_credits_user` ON `ce_credits` (`user_id`);
CREATE INDEX `idx_ce_credits_track` ON `ce_credits` (`track_id`);
CREATE INDEX `idx_ce_credits_status` ON `ce_credits` (`status`);
CREATE INDEX `idx_cp_chapter` ON `chapter_prerequisites` (`chapter_id`);
CREATE INDEX `idx_cp_prereq` ON `chapter_prerequisites` (`prerequisite_chapter_id`);
CREATE INDEX `idx_client_associations_client_id` ON `client_associations` (`clientId`);
CREATE INDEX `idx_client_associations_professional_id` ON `client_associations` (`professionalId`);
CREATE INDEX `idx_client_associations_organization_id` ON `client_associations` (`organizationId`);
CREATE INDEX `idx_client_discovery_client` ON `client_discovery` (`client_id`);
CREATE INDEX `idx_client_discovery_advisor` ON `client_discovery` (`advisor_id`);
CREATE INDEX `idx_client_goals_client` ON `client_goals` (`client_id`);
CREATE INDEX `idx_client_goals_advisor` ON `client_goals` (`advisor_id`);
CREATE INDEX `idx_client_goals_node` ON `client_goals` (`planning_node_id`);
CREATE INDEX `idx_client_goals_category` ON `client_goals` (`goal_category`);
CREATE INDEX `idx_client_segments_client_id` ON `client_segments` (`clientId`);
CREATE INDEX `idx_client_segments_professional_id` ON `client_segments` (`professionalId`);
CREATE INDEX `idx_coaching_messages_user_id` ON `coaching_messages` (`user_id`);
CREATE INDEX `idx_coaching_messages_organization_id` ON `coaching_messages` (`organization_id`);
CREATE INDEX `idx_coi_contacts_professional_id` ON `coi_contacts` (`professionalId`);
CREATE INDEX `idx_coi_contacts_firm_id` ON `coi_contacts` (`firmId`);
CREATE INDEX `idx_coi_disclosures_user_id` ON `coi_disclosures` (`user_id`);
CREATE INDEX `idx_coi_disclosures_advisor_id` ON `coi_disclosures` (`advisor_id`);
CREATE INDEX `idx_coi_disclosures_org_id` ON `coi_disclosures` (`org_id`);
CREATE INDEX `idx_coi_disclosures_related_product_id` ON `coi_disclosures` (`related_product_id`);
CREATE INDEX `idx_coi_disclosures_related_recommendation_id` ON `coi_disclosures` (`related_recommendation_id`);
CREATE INDEX `idx_coi_verification_badges_coi_contact_id` ON `coi_verification_badges` (`coi_contact_id`);
CREATE INDEX `idx_coi_verification_badges_professional_id` ON `coi_verification_badges` (`professional_id`);
CREATE INDEX `idx_coi_verification_badges_source_verification_id` ON `coi_verification_badges` (`source_verification_id`);
CREATE INDEX `idx_comms_log_user_id` ON `comms_log` (`user_id`);
CREATE INDEX `idx_comms_log_client_id` ON `comms_log` (`client_id`);
CREATE INDEX `idx_comms_log_template_id` ON `comms_log` (`template_id`);
CREATE INDEX `idx_compliance_audit_message_id` ON `compliance_audit` (`messageId`);
CREATE INDEX `idx_compliance_audit_user_id` ON `compliance_audit` (`userId`);
CREATE INDEX `idx_compliance_audit_conversation_id` ON `compliance_audit` (`conversationId`);
CREATE INDEX `idx_compliance_audit_reviewer_id` ON `compliance_audit` (`reviewerId`);
CREATE INDEX `idx_compliance_audit_samples_supervisor` ON `compliance_audit_samples` (`supervisor_id`);
CREATE INDEX `idx_compliance_audit_samples_status` ON `compliance_audit_samples` (`status`);
CREATE INDEX `idx_compliance_flags_review_id` ON `compliance_flags` (`reviewId`);
CREATE INDEX `idx_compliance_predictions_agent_action_id` ON `compliance_predictions` (`agent_action_id`);
CREATE INDEX `idx_compliance_prescreening_message_id` ON `compliance_prescreening` (`message_id`);
CREATE INDEX `idx_compliance_prescreening_conversation_id` ON `compliance_prescreening` (`conversation_id`);
CREATE INDEX `idx_compliance_reviews_user_id` ON `compliance_reviews` (`user_id`);
CREATE INDEX `idx_compliance_reviews_organization_id` ON `compliance_reviews` (`organization_id`);
CREATE INDEX `idx_compliance_reviews_reviewer_id` ON `compliance_reviews` (`reviewer_id`);
CREATE INDEX `idx_consent_tracking_user_id` ON `consent_tracking` (`user_id`);
CREATE INDEX `idx_constitutional_violations_message_id` ON `constitutional_violations` (`message_id`);
CREATE INDEX `idx_consultation_bookings_user_id` ON `consultation_bookings` (`user_id`);
CREATE INDEX `idx_consultation_bookings_professional_id` ON `consultation_bookings` (`professional_id`);
CREATE INDEX `idx_consultation_bookings_pre_brief_id` ON `consultation_bookings` (`pre_brief_id`);
CREATE INDEX `idx_content_shares_content` ON `content_shares` (`content_type`,`content_id`);
CREATE INDEX `idx_content_shares_owner_id` ON `content_shares` (`owner_id`);
CREATE INDEX `idx_content_shares_shared_with_user` ON `content_shares` (`shared_with_user_id`);
CREATE INDEX `idx_content_shares_shared_with_org` ON `content_shares` (`shared_with_org_id`);
CREATE INDEX `idx_context_assembly_log_conversation_id` ON `context_assembly_log` (`conversation_id`);
CREATE INDEX `idx_context_assembly_log_message_id` ON `context_assembly_log` (`message_id`);
CREATE INDEX `idx_conversation_compliance_scores_conversation_id` ON `conversation_compliance_scores` (`conversation_id`);
CREATE INDEX `idx_conversation_folders_user_id` ON `conversation_folders` (`userId`);
CREATE INDEX `idx_conversation_topics_conversation_id` ON `conversation_topics` (`conversation_id`);
CREATE INDEX `idx_conversation_topics_message_id` ON `conversation_topics` (`message_id`);
CREATE INDEX `idx_conversations_user_id` ON `conversations` (`userId`);
CREATE INDEX `idx_conversations_folder_id` ON `conversations` (`folderId`);
CREATE INDEX `idx_conversations_organization_id` ON `conversations` (`organizationId`);
CREATE INDEX `idx_conversations_user_created_at` ON `conversations` (`userId`,`createdAt`);
CREATE INDEX `idx_credit_profiles_user_id` ON `credit_profiles` (`user_id`);
CREATE INDEX `idx_credit_profiles_consent_id` ON `credit_profiles` (`consent_id`);
CREATE INDEX `idx_data_access_audit_adapter` ON `data_access_audit` (`adapter_id`);
CREATE INDEX `idx_data_access_audit_user` ON `data_access_audit` (`user_id`);
CREATE INDEX `idx_data_access_audit_ts` ON `data_access_audit` (`timestamp`);
CREATE INDEX `idx_data_auth_client` ON `data_authorizations` (`client_id`);
CREATE INDEX `idx_data_auth_advisor` ON `data_authorizations` (`advisor_id`);
CREATE INDEX `idx_data_auth_status` ON `data_authorizations` (`status`);
CREATE INDEX `idx_data_quality_scores_data_source_id` ON `data_quality_scores` (`data_source_id`);
CREATE INDEX `idx_data_quality_scores_ingestion_job_id` ON `data_quality_scores` (`ingestion_job_id`);
CREATE INDEX `idx_data_sources_firm_id` ON `data_sources` (`firmId`);
CREATE INDEX `idx_data_value_scores_record_id` ON `data_value_scores` (`record_id`);
CREATE INDEX `idx_delegations_delegator_id` ON `delegations` (`delegator_id`);
CREATE INDEX `idx_delegations_delegate_id` ON `delegations` (`delegate_id`);
CREATE INDEX `idx_digital_asset_inventory_user_id` ON `digital_asset_inventory` (`userId`);
CREATE INDEX `idx_disclaimer_audit_conversation_id` ON `disclaimer_audit` (`conversation_id`);
CREATE INDEX `idx_disclaimer_audit_disclaimer_id` ON `disclaimer_audit` (`disclaimer_id`);
CREATE INDEX `idx_disclaimer_interactions_disclaimer_id` ON `disclaimer_interactions` (`disclaimer_id`);
CREATE INDEX `idx_disclaimer_interactions_user_id` ON `disclaimer_interactions` (`user_id`);
CREATE INDEX `idx_disclaimer_translations_disclaimer_id` ON `disclaimer_translations` (`disclaimer_id`);
CREATE INDEX `idx_document_annotations_document_id` ON `document_annotations` (`documentId`);
CREATE INDEX `idx_document_annotations_user_id` ON `document_annotations` (`userId`);
CREATE INDEX `idx_document_annotations_parent_id` ON `document_annotations` (`parentId`);
CREATE INDEX `idx_document_chunks_document_id` ON `document_chunks` (`documentId`);
CREATE INDEX `idx_document_chunks_user_id` ON `document_chunks` (`userId`);
CREATE INDEX `idx_document_extractions_user_id` ON `document_extractions` (`userId`);
CREATE INDEX `idx_document_extractions_document_id` ON `document_extractions` (`documentId`);
CREATE INDEX `idx_document_extractions_ingestion_job_id` ON `document_extractions` (`ingestionJobId`);
CREATE INDEX `idx_document_tag_map_document_id` ON `document_tag_map` (`documentId`);
CREATE INDEX `idx_document_tag_map_tag_id` ON `document_tag_map` (`tagId`);
CREATE INDEX `idx_document_tags_user_id` ON `document_tags` (`userId`);
CREATE INDEX `idx_document_templates_org_id` ON `document_templates` (`org_id`);
CREATE INDEX `idx_document_versions_document_id` ON `document_versions` (`documentId`);
CREATE INDEX `idx_document_versions_user_id` ON `document_versions` (`userId`);
CREATE INDEX `idx_documents_user_id` ON `documents` (`userId`);
CREATE INDEX `idx_documents_organization_id` ON `documents` (`organizationId`);
CREATE INDEX `idx_education_progress_user_id` ON `education_progress` (`userId`);
CREATE INDEX `idx_education_progress_module_id` ON `education_progress` (`moduleId`);
CREATE INDEX `idx_education_triggers_education_module_id` ON `education_triggers` (`education_module_id`);
CREATE INDEX `idx_email_campaigns_user_id` ON `email_campaigns` (`user_id`);
CREATE INDEX `idx_email_campaigns_template_id` ON `email_campaigns` (`template_id`);
CREATE INDEX `idx_email_sends_campaign_id` ON `email_sends` (`campaign_id`);
CREATE INDEX `idx_engagement_letters_client` ON `engagement_letters` (`client_id`);
CREATE INDEX `idx_engagement_letters_advisor` ON `engagement_letters` (`advisor_id`);
CREATE INDEX `idx_engagement_letters_status` ON `engagement_letters` (`status`);
CREATE INDEX `idx_engagement_scores_user_id` ON `engagement_scores` (`user_id`);
CREATE INDEX `idx_engagement_scores_client_id` ON `engagement_scores` (`client_id`);
CREATE INDEX `idx_engagement_scores_organization_id` ON `engagement_scores` (`organization_id`);
CREATE INDEX `idx_enrichment_cache_connection_id` ON `enrichment_cache` (`connection_id`);
CREATE INDEX `idx_enrichment_cohorts_dataset_id` ON `enrichment_cohorts` (`datasetId`);
CREATE INDEX `idx_enrichment_matches_user_id` ON `enrichment_matches` (`userId`);
CREATE INDEX `idx_enrichment_matches_dataset_id` ON `enrichment_matches` (`datasetId`);
CREATE INDEX `idx_enrichment_matches_cohort_id` ON `enrichment_matches` (`cohortId`);
CREATE INDEX `idx_entity_resolution_rules_canonical_entity_id` ON `entity_resolution_rules` (`canonical_entity_id`);
CREATE INDEX `idx_equity_grants_user_id` ON `equity_grants` (`userId`);
CREATE INDEX `idx_esignature_tracking_professional_id` ON `esignature_tracking` (`professional_id`);
CREATE INDEX `idx_esignature_tracking_client_user_id` ON `esignature_tracking` (`client_user_id`);
CREATE INDEX `idx_esignature_tracking_envelope_id` ON `esignature_tracking` (`envelope_id`);
CREATE INDEX `idx_esignature_tracking_related_product_id` ON `esignature_tracking` (`related_product_id`);
CREATE INDEX `idx_esignature_tracking_related_quote_id` ON `esignature_tracking` (`related_quote_id`);
CREATE INDEX `idx_estate_documents_client_id` ON `estate_documents` (`clientId`);
CREATE INDEX `idx_estate_documents_attorney_id` ON `estate_documents` (`attorneyId`);
CREATE INDEX `idx_exchange_analyses_client` ON `exchange_analyses` (`clientId`);
CREATE INDEX `idx_exchange_analyses_advisor` ON `exchange_analyses` (`advisorId`);
CREATE INDEX `idx_exchange_analyses_status` ON `exchange_analyses` (`status`);
CREATE INDEX `idx_export_jobs_user_id` ON `export_jobs` (`user_id`);
CREATE INDEX `idx_export_jobs_org_id` ON `export_jobs` (`org_id`);
CREATE INDEX `idx_extraction_plan_jobs_plan_id` ON `extraction_plan_jobs` (`plan_id`);
CREATE INDEX `idx_fairness_test_results_run_id` ON `fairness_test_results` (`run_id`);
CREATE INDEX `idx_fairness_test_results_prompt_id` ON `fairness_test_results` (`prompt_id`);
CREATE INDEX `idx_feature_flags_organization_id` ON `feature_flags` (`organizationId`);
CREATE INDEX `idx_feature_permissions_user_id` ON `feature_permissions` (`user_id`);
CREATE INDEX `idx_feature_permissions_org_id` ON `feature_permissions` (`org_id`);
CREATE INDEX `idx_feature_permissions_feature_id` ON `feature_permissions` (`feature_id`);
CREATE INDEX `idx_feedback_user_id` ON `feedback` (`userId`);
CREATE INDEX `idx_feedback_message_id` ON `feedback` (`messageId`);
CREATE INDEX `idx_feedback_conversation_id` ON `feedback` (`conversationId`);
CREATE INDEX `idx_field_sharing_controls_user_id` ON `field_sharing_controls` (`user_id`);
CREATE INDEX `idx_file_chunks_file_id` ON `file_chunks` (`file_id`);
CREATE INDEX `idx_file_derived_enrichments_file_id` ON `file_derived_enrichments` (`file_id`);
CREATE INDEX `idx_file_derived_enrichments_user_id` ON `file_derived_enrichments` (`user_id`);
CREATE INDEX `idx_file_uploads_user_id` ON `file_uploads` (`user_id`);
CREATE INDEX `idx_file_uploads_organization_id` ON `file_uploads` (`organization_id`);
CREATE INDEX `idx_file_uploads_connection_id` ON `file_uploads` (`connection_id`);
CREATE INDEX `idx_gate_reviews_action_id` ON `gate_reviews` (`actionId`);
CREATE INDEX `idx_gate_reviews_reviewer_id` ON `gate_reviews` (`reviewerId`);
CREATE INDEX `idx_gate_reviews_client_id` ON `gate_reviews` (`clientId`);
CREATE INDEX `idx_gate_reviews_professional_id` ON `gate_reviews` (`professionalId`);
CREATE INDEX `idx_gate_reviews_firm_id` ON `gate_reviews` (`firmId`);
CREATE INDEX `idx_generated_documents_user_id` ON `generated_documents` (`user_id`);
CREATE INDEX `idx_generated_documents_organization_id` ON `generated_documents` (`organization_id`);
CREATE INDEX `idx_ghl_locations_location_id` ON `ghl_locations` (`location_id`);
CREATE INDEX `idx_ghl_locations_org` ON `ghl_locations` (`organization_id`);
CREATE INDEX `idx_ghl_locations_active` ON `ghl_locations` (`is_active`);
CREATE INDEX `idx_health_scores_user_id` ON `health_scores` (`user_id`);
CREATE INDEX `idx_hns_user_lead` ON `hnw_narrative_scores` (`user_id`,`lead_id`);
CREATE INDEX `idx_hns_cadence` ON `hnw_narrative_scores` (`recommended_cadence`);
CREATE INDEX `idx_hypothesis_test_results_hypothesis_id` ON `hypothesis_test_results` (`hypothesis_id`);
CREATE INDEX `idx_improvement_actions_audit_id` ON `improvement_actions` (`audit_id`);
CREATE INDEX `idx_improvement_feedback_action_id` ON `improvement_feedback` (`action_id`);
CREATE INDEX `idx_improvement_feedback_user_id` ON `improvement_feedback` (`user_id`);
CREATE INDEX `idx_improvement_hypotheses_status_created` ON `improvement_hypotheses` (`status`,`created_at`);
CREATE INDEX `idx_improvement_signals_type_detected` ON `improvement_signals` (`signal_type`,`detected_at`);
CREATE INDEX `idx_ingested_records_data_source_id` ON `ingested_records` (`dataSourceId`);
CREATE INDEX `idx_ingested_records_ingestion_job_id` ON `ingested_records` (`ingestionJobId`);
CREATE INDEX `idx_ingested_records_entity_id` ON `ingested_records` (`entityId`);
CREATE INDEX `idx_ingestion_jobs_data_source_id` ON `ingestion_jobs` (`dataSourceId`);
CREATE INDEX `idx_insight_actions_insight_id` ON `insight_actions` (`insight_id`);
CREATE INDEX `idx_insurance_applications_client_id` ON `insurance_applications` (`clientId`);
CREATE INDEX `idx_insurance_applications_professional_id` ON `insurance_applications` (`professionalId`);
CREATE INDEX `idx_insurance_applications_gate_review_id` ON `insurance_applications` (`gateReviewId`);
CREATE INDEX `idx_insurance_applications_reviewer_id` ON `insurance_applications` (`reviewerId`);
CREATE INDEX `idx_insurance_carriers_am_best_id` ON `insurance_carriers` (`am_best_id`);
CREATE INDEX `idx_insurance_carriers_naic_id` ON `insurance_carriers` (`naic_id`);
CREATE INDEX `idx_insurance_products_carrier_id` ON `insurance_products` (`carrier_id`);
CREATE INDEX `idx_insurance_products_compulife_product_id` ON `insurance_products` (`compulife_product_id`);
CREATE INDEX `idx_insurance_quotes_client_id` ON `insurance_quotes` (`clientId`);
CREATE INDEX `idx_insurance_quotes_professional_id` ON `insurance_quotes` (`professionalId`);
CREATE INDEX `idx_insurance_quotes_quote_run_id` ON `insurance_quotes` (`quoteRunId`);
CREATE INDEX `idx_bpr_blueprint` ON `integration_blueprint_runs` (`blueprint_id`);
CREATE INDEX `idx_bpr_status` ON `integration_blueprint_runs` (`status`);
CREATE INDEX `idx_bpr_started` ON `integration_blueprint_runs` (`started_at`);
CREATE INDEX `idx_bps_blueprint` ON `integration_blueprint_samples` (`blueprint_id`);
CREATE INDEX `idx_bpv_blueprint` ON `integration_blueprint_versions` (`blueprint_id`);
CREATE INDEX `idx_blueprint_slug` ON `integration_blueprints` (`slug`);
CREATE INDEX `idx_blueprint_owner` ON `integration_blueprints` (`owner_id`);
CREATE INDEX `idx_blueprint_org` ON `integration_blueprints` (`organization_id`);
CREATE INDEX `idx_blueprint_status` ON `integration_blueprints` (`status`);
CREATE INDEX `idx_integration_connections_provider_id` ON `integration_connections` (`provider_id`);
CREATE INDEX `idx_integration_connections_owner_id` ON `integration_connections` (`owner_id`);
CREATE INDEX `idx_integration_connections_organization_id` ON `integration_connections` (`organization_id`);
CREATE INDEX `idx_integration_connections_user_id` ON `integration_connections` (`user_id`);
CREATE INDEX `idx_integration_field_mappings_connection_id` ON `integration_field_mappings` (`connection_id`);
CREATE INDEX `idx_integration_health_checks_connection_id` ON `integration_health_checks` (`connection_id`);
CREATE INDEX `idx_integration_health_checks_provider_id` ON `integration_health_checks` (`provider_id`);
CREATE INDEX `idx_integration_health_summary_connection_id` ON `integration_health_summary` (`connection_id`);
CREATE INDEX `idx_integration_improvement_log_connection_id` ON `integration_improvement_log` (`connection_id`);
CREATE INDEX `idx_integration_improvement_log_provider_id` ON `integration_improvement_log` (`provider_id`);
CREATE INDEX `idx_integration_sync_config_connection_id` ON `integration_sync_config` (`connection_id`);
CREATE INDEX `idx_integration_sync_logs_connection_id` ON `integration_sync_logs` (`connection_id`);
CREATE INDEX `idx_integration_sync_logs_triggered_by_user_id` ON `integration_sync_logs` (`triggered_by_user_id`);
CREATE INDEX `idx_integration_webhook_events_connection_id` ON `integration_webhook_events` (`connection_id`);
CREATE INDEX `idx_iul_crediting_history_product_id` ON `iul_crediting_history` (`product_id`);
CREATE INDEX `idx_kb_access_transitions_owner_id` ON `kb_access_transitions` (`owner_id`);
CREATE INDEX `idx_kb_access_transitions_from_grantee_id` ON `kb_access_transitions` (`from_grantee_id`);
CREATE INDEX `idx_kb_access_transitions_to_grantee_id` ON `kb_access_transitions` (`to_grantee_id`);
CREATE INDEX `idx_kb_sharing_permissions_owner_id` ON `kb_sharing_permissions` (`owner_id`);
CREATE INDEX `idx_kb_sharing_permissions_grantee_id` ON `kb_sharing_permissions` (`grantee_id`);
CREATE INDEX `idx_kg_edges_user_id` ON `kg_edges` (`userId`);
CREATE INDEX `idx_kg_edges_source_node_id` ON `kg_edges` (`sourceNodeId`);
CREATE INDEX `idx_kg_edges_target_node_id` ON `kg_edges` (`targetNodeId`);
CREATE INDEX `idx_kg_nodes_user_id` ON `kg_nodes` (`userId`);
CREATE INDEX `idx_knowledge_article_feedback_article_id` ON `knowledge_article_feedback` (`article_id`);
CREATE INDEX `idx_knowledge_article_feedback_user_id` ON `knowledge_article_feedback` (`user_id`);
CREATE INDEX `idx_knowledge_article_versions_article_id` ON `knowledge_article_versions` (`article_id`);
CREATE INDEX `idx_knowledge_gap_feedback_user_id` ON `knowledge_gap_feedback` (`userId`);
CREATE INDEX `idx_knowledge_gap_feedback_gap_id` ON `knowledge_gap_feedback` (`gapId`);
CREATE INDEX `idx_knowledge_graph_edges_from_entity_id` ON `knowledge_graph_edges` (`from_entity_id`);
CREATE INDEX `idx_knowledge_graph_edges_to_entity_id` ON `knowledge_graph_edges` (`to_entity_id`);
CREATE INDEX `idx_layer_audits_target_id` ON `layer_audits` (`target_id`);
CREATE INDEX `idx_layer_metrics_target_id` ON `layer_metrics` (`target_id`);
CREATE INDEX `idx_lp_status` ON `lead_pipeline` (`status`);
CREATE INDEX `idx_lp_ghl_contact` ON `lead_pipeline` (`ghl_contact_id`);
CREATE INDEX `idx_lp_assigned_advisor` ON `lead_pipeline` (`assigned_advisor_id`);
CREATE INDEX `idx_lead_profile_ident` ON `lead_profile_accumulator` (`identifier_type`,`identifier_value`);
CREATE INDEX `idx_learning_achievements_user` ON `learning_achievements` (`user_id`);
CREATE INDEX `idx_learning_aiq_discipline` ON `learning_ai_quiz_questions` (`discipline`);
CREATE INDEX `idx_learning_bookmarks_user` ON `learning_bookmarks` (`user_id`);
CREATE INDEX `idx_learning_ce_credits_user` ON `learning_ce_credits` (`user_id`);
CREATE INDEX `idx_learning_ce_credits_license` ON `learning_ce_credits` (`license_id`);
CREATE INDEX `idx_learning_challenge_results_challenge` ON `learning_challenge_results` (`challenge_id`);
CREATE INDEX `idx_learning_chapters_track` ON `learning_chapters` (`track_id`);
CREATE INDEX `idx_learning_ch_content` ON `learning_content_history` (`content_table`,`content_id`);
CREATE INDEX `idx_learning_cv_source_key` ON `learning_content_versions` (`content_source`,`content_key`);
CREATE INDEX `idx_learning_def_discipline` ON `learning_definitions` (`discipline_id`);
CREATE INDEX `idx_learning_def_term` ON `learning_definitions` (`term`);
CREATE INDEX `idx_learning_discovery_user` ON `learning_discovery_history` (`user_id`);
CREATE INDEX `idx_learning_fc_track` ON `learning_flashcards` (`track_id`);
CREATE INDEX `idx_learning_group_activity_group` ON `learning_group_activity` (`group_id`);
CREATE INDEX `idx_learning_group_goals_group` ON `learning_group_goals` (`group_id`);
CREATE INDEX `idx_learning_group_members_group` ON `learning_group_members` (`group_id`);
CREATE INDEX `idx_learning_group_members_user` ON `learning_group_members` (`user_id`);
CREATE INDEX `idx_learning_group_notes_group` ON `learning_group_notes` (`group_id`);
CREATE INDEX `idx_learning_licenses_user` ON `learning_licenses` (`user_id`);
CREATE INDEX `idx_learning_licenses_type` ON `learning_licenses` (`license_type`);
CREATE INDEX `idx_learning_mastery_user` ON `learning_mastery_progress` (`user_id`);
CREATE INDEX `idx_learning_mastery_item` ON `learning_mastery_progress` (`item_key`);
CREATE INDEX `idx_learning_playlist_items_playlist` ON `learning_playlist_items` (`playlist_id`);
CREATE INDEX `idx_learning_pq_track` ON `learning_practice_questions` (`track_id`);
CREATE INDEX `idx_learning_pq_chapter` ON `learning_practice_questions` (`chapter_id`);
CREATE INDEX `idx_learning_reg_status` ON `learning_regulatory_updates` (`reg_status`);
CREATE INDEX `idx_learning_settings_user_key` ON `learning_settings` (`user_id`,`setting_key`);
CREATE INDEX `idx_ls_flag` ON `learning_streaks` (`feature_flag`);
CREATE INDEX `idx_learning_sessions_user` ON `learning_study_sessions` (`user_id`);
CREATE INDEX `idx_learning_subsections_chapter` ON `learning_subsections` (`chapter_id`);
CREATE INDEX `idx_learning_tracks_category` ON `learning_tracks` (`category`);
CREATE INDEX `idx_lat_location_metric` ON `location_alert_thresholds` (`location_db_id`,`metric_name`);
CREATE INDEX `idx_lat_location` ON `location_alert_thresholds` (`location_db_id`);
CREATE INDEX `idx_lat_enabled` ON `location_alert_thresholds` (`enabled`);
CREATE INDEX `idx_ltc_analyses_user_id` ON `ltc_analyses` (`user_id`);
CREATE INDEX `idx_manager_ai_settings_manager_id` ON `manager_ai_settings` (`managerId`);
CREATE INDEX `idx_manager_ai_settings_organization_id` ON `manager_ai_settings` (`organizationId`);
CREATE INDEX `idx_market_data_subscriptions_user_id` ON `market_data_subscriptions` (`user_id`);
CREATE INDEX `idx_meddpicc_user_lead` ON `meddpicc_scores` (`user_id`,`lead_id`);
CREATE INDEX `idx_meddpicc_tier` ON `meddpicc_scores` (`tier`);
CREATE INDEX `idx_meeting_action_items_meeting_id` ON `meeting_action_items` (`meetingId`);
CREATE INDEX `idx_meeting_action_items_user_id` ON `meeting_action_items` (`userId`);
CREATE INDEX `idx_meetings_user_id` ON `meetings` (`userId`);
CREATE INDEX `idx_meetings_organization_id` ON `meetings` (`organizationId`);
CREATE INDEX `idx_meetings_client_id` ON `meetings` (`clientId`);
CREATE INDEX `idx_memories_user_id` ON `memories` (`userId`);
CREATE INDEX `idx_memory_episodes_user_id` ON `memory_episodes` (`userId`);
CREATE INDEX `idx_memory_episodes_conversation_id` ON `memory_episodes` (`conversationId`);
CREATE INDEX `idx_messages_conversation_id` ON `messages` (`conversationId`);
CREATE INDEX `idx_messages_user_id` ON `messages` (`userId`);
CREATE INDEX `idx_mfa_backup_codes_user_id` ON `mfa_backup_codes` (`user_id`);
CREATE INDEX `idx_mfa_secrets_user_id` ON `mfa_secrets` (`user_id`);
CREATE INDEX `idx_model_backtests_user_id` ON `model_backtests` (`user_id`);
CREATE INDEX `idx_model_output_records_run_id` ON `model_output_records` (`run_id`);
CREATE INDEX `idx_model_output_records_model_id` ON `model_output_records` (`model_id`);
CREATE INDEX `idx_model_output_records_entity_id` ON `model_output_records` (`entity_id`);
CREATE INDEX `idx_model_runs_model_id` ON `model_runs` (`model_id`);
CREATE INDEX `idx_model_scenarios_user_id` ON `model_scenarios` (`user_id`);
CREATE INDEX `idx_model_scenarios_base_run_id` ON `model_scenarios` (`base_run_id`);
CREATE INDEX `idx_model_schedules_model_id` ON `model_schedules` (`model_id`);
CREATE INDEX `idx_nitrogen_risk_profiles_user_id` ON `nitrogen_risk_profiles` (`user_id`);
CREATE INDEX `idx_notification_log_user_id` ON `notification_log` (`userId`);
CREATE INDEX `idx_notification_log_user_read` ON `notification_log` (`userId`,`readAt`);
CREATE INDEX `idx_ohr_oh` ON `office_hour_registrations` (`office_hour_id`);
CREATE INDEX `idx_ohr_user` ON `office_hour_registrations` (`user_id`);
CREATE INDEX `idx_oh_host` ON `office_hours` (`host_user_id`);
CREATE INDEX `idx_oh_track` ON `office_hours` (`track_id`);
CREATE INDEX `idx_oh_status` ON `office_hours` (`status`);
CREATE INDEX `idx_oh_scheduled` ON `office_hours` (`scheduled_at`);
CREATE INDEX `idx_onboarding_progress_user_id` ON `onboarding_progress` (`user_id`);
CREATE INDEX `idx_org_ai_config_org_id` ON `org_ai_config` (`org_id`);
CREATE INDEX `idx_org_prompt_customizations_org_id` ON `org_prompt_customizations` (`org_id`);
CREATE INDEX `idx_org_retention_policies_org_id` ON `org_retention_policies` (`org_id`);
CREATE INDEX `idx_organization_ai_settings_organization_id` ON `organization_ai_settings` (`organizationId`);
CREATE INDEX `idx_organization_landing_page_config_organization_id` ON `organization_landing_page_config` (`organizationId`);
CREATE INDEX `idx_organization_relationships_parent_org_id` ON `organization_relationships` (`parentOrgId`);
CREATE INDEX `idx_organization_relationships_child_org_id` ON `organization_relationships` (`childOrgId`);
CREATE INDEX `idx_paper_trades_user_id` ON `paper_trades` (`user_id`);
CREATE INDEX `idx_passive_action_log_user_id` ON `passive_action_log` (`user_id`);
CREATE INDEX `idx_passive_action_log_preference_id` ON `passive_action_log` (`preference_id`);
CREATE INDEX `idx_passive_action_preferences_user_id` ON `passive_action_preferences` (`user_id`);
CREATE INDEX `idx_pta_user` ON `pattern_transition_assessments` (`user_id`);
CREATE INDEX `idx_pta_assessed_at` ON `pattern_transition_assessments` (`assessed_at`);
CREATE INDEX `idx_pgm_group` ON `peer_group_members` (`group_id`);
CREATE INDEX `idx_pgm_user` ON `peer_group_members` (`user_id`);
CREATE INDEX `idx_pgmsg_group` ON `peer_group_messages` (`group_id`);
CREATE INDEX `idx_peer_groups_track` ON `peer_groups` (`track_id`);
CREATE INDEX `idx_peer_groups_status` ON `peer_groups` (`status`);
CREATE INDEX `idx_perm_audit_actor_id` ON `permission_audit_log` (`actor_id`);
CREATE INDEX `idx_perm_audit_target_user_id` ON `permission_audit_log` (`target_user_id`);
CREATE INDEX `idx_perm_audit_action_type` ON `permission_audit_log` (`action_type`);
CREATE INDEX `idx_perm_audit_created_at` ON `permission_audit_log` (`created_at`);
CREATE INDEX `idx_pfr_client` ON `personal_financial_reviews` (`client_id`);
CREATE INDEX `idx_pfr_advisor` ON `personal_financial_reviews` (`advisor_id`);
CREATE INDEX `idx_pfr_review_type` ON `personal_financial_reviews` (`review_type`);
CREATE INDEX `idx_pfm_imports_user` ON `pfm_imports` (`user_id`);
CREATE INDEX `idx_pfm_imports_status` ON `pfm_imports` (`status`);
CREATE INDEX `idx_pfr_client` ON `pfr_documents` (`client_id`);
CREATE INDEX `idx_pfr_advisor` ON `pfr_documents` (`advisor_id`);
CREATE INDEX `idx_pfr_status` ON `pfr_documents` (`status`);
CREATE INDEX `idx_plaid_holdings_user_id` ON `plaid_holdings` (`user_id`);
CREATE INDEX `idx_plaid_holdings_account_id` ON `plaid_holdings` (`account_id`);
CREATE INDEX `idx_plaid_holdings_security_id` ON `plaid_holdings` (`security_id`);
CREATE INDEX `idx_plaid_items_user_id` ON `plaid_items` (`user_id`);
CREATE INDEX `idx_plaid_items_item_id` ON `plaid_items` (`item_id`);
CREATE INDEX `idx_plaid_webhook_log_item_id` ON `plaid_webhook_log` (`item_id`);
CREATE INDEX `idx_plaid_webhooks_log_item_id` ON `plaid_webhooks_log` (`item_id`);
CREATE INDEX `idx_plan_adherence_user_id` ON `plan_adherence` (`userId`);
CREATE INDEX `idx_planning_assumptions_owner` ON `planning_assumptions` (`owner_id`);
CREATE INDEX `idx_planning_assumptions_scope` ON `planning_assumptions` (`assumption_scope`,`scope_entity_id`);
CREATE INDEX `idx_planning_nodes_parent` ON `planning_nodes` (`parent_id`);
CREATE INDEX `idx_planning_nodes_owner` ON `planning_nodes` (`owner_id`);
CREATE INDEX `idx_planning_nodes_level` ON `planning_nodes` (`level`);
CREATE INDEX `idx_planning_nodes_entity` ON `planning_nodes` (`entity_type`,`entity_id`);
CREATE INDEX `idx_planning_refs_node` ON `planning_references` (`planning_node_id`);
CREATE INDEX `idx_planning_refs_type` ON `planning_references` (`ref_type`);
CREATE INDEX `idx_planning_snapshots_client` ON `planning_snapshots` (`client_id`);
CREATE INDEX `idx_planning_snapshots_date` ON `planning_snapshots` (`snapshot_date`);
CREATE INDEX `idx_planning_snapshots_type` ON `planning_snapshots` (`snapshot_type`);
CREATE INDEX `idx_platform_learnings_type_confidence` ON `platform_learnings` (`learning_type`,`confidence`);
CREATE INDEX `idx_policy_deliveries_client` ON `policy_deliveries` (`clientId`);
CREATE INDEX `idx_policy_deliveries_advisor` ON `policy_deliveries` (`advisorId`);
CREATE INDEX `idx_policy_deliveries_application` ON `policy_deliveries` (`applicationId`);
CREATE INDEX `idx_policy_deliveries_status` ON `policy_deliveries` (`status`);
CREATE INDEX `idx_policy_deliveries_free_look` ON `policy_deliveries` (`freeLookStatus`,`freeLookEndDate`);
CREATE INDEX `idx_portal_engagement_user_id` ON `portal_engagement` (`user_id`);
CREATE INDEX `idx_practice_metrics_professional_id` ON `practice_metrics` (`professionalId`);
CREATE INDEX `idx_practice_metrics_firm_id` ON `practice_metrics` (`firmId`);
CREATE INDEX `idx_premium_finance_cases_client_id` ON `premium_finance_cases` (`clientId`);
CREATE INDEX `idx_premium_finance_cases_professional_id` ON `premium_finance_cases` (`professionalId`);
CREATE INDEX `idx_premium_finance_cases_gate_review_id` ON `premium_finance_cases` (`gateReviewId`);
CREATE INDEX `idx_privacy_audit_user_id` ON `privacy_audit` (`userId`);
CREATE INDEX `idx_privacy_consent_log_client` ON `privacy_consent_log` (`client_id`);
CREATE INDEX `idx_privacy_consent_log_type` ON `privacy_consent_log` (`consent_type`);
CREATE INDEX `idx_proactive_insights_user_id` ON `proactive_insights` (`user_id`);
CREATE INDEX `idx_proactive_insights_organization_id` ON `proactive_insights` (`organization_id`);
CREATE INDEX `idx_proactive_insights_client_id` ON `proactive_insights` (`client_id`);
CREATE INDEX `idx_product_suitability_evaluations_product_id` ON `product_suitability_evaluations` (`product_id`);
CREATE INDEX `idx_product_suitability_evaluations_user_id` ON `product_suitability_evaluations` (`user_id`);
CREATE INDEX `idx_products_organization_id` ON `products` (`organizationId`);
CREATE INDEX `idx_professional_ai_settings_professional_id` ON `professional_ai_settings` (`professionalId`);
CREATE INDEX `idx_professional_ai_settings_organization_id` ON `professional_ai_settings` (`organizationId`);
CREATE INDEX `idx_professional_ai_settings_manager_id` ON `professional_ai_settings` (`managerId`);
CREATE INDEX `idx_professional_availability_professional_id` ON `professional_availability` (`professional_id`);
CREATE INDEX `idx_professional_context_user_id` ON `professional_context` (`userId`);
CREATE INDEX `idx_professional_relationships_user_id` ON `professional_relationships` (`user_id`);
CREATE INDEX `idx_professional_relationships_professional_id` ON `professional_relationships` (`professional_id`);
CREATE INDEX `idx_professional_reviews_professional_id` ON `professional_reviews` (`professional_id`);
CREATE INDEX `idx_professional_reviews_user_id` ON `professional_reviews` (`user_id`);
CREATE INDEX `idx_professional_verifications_professional_id` ON `professional_verifications` (`professional_id`);
CREATE INDEX `idx_professional_verifications_external_id` ON `professional_verifications` (`external_id`);
CREATE INDEX `idx_professionals_linked_user_id` ON `professionals` (`linked_user_id`);
CREATE INDEX `idx_prompt_experiment_results_variant_a_id` ON `prompt_experiment_results` (`variant_a_id`);
CREATE INDEX `idx_prompt_experiment_results_variant_b_id` ON `prompt_experiment_results` (`variant_b_id`);
CREATE INDEX `idx_prompt_experiment_results_winner_id` ON `prompt_experiment_results` (`winner_id`);
CREATE INDEX `idx_prompt_experiments_variant_id` ON `prompt_experiments` (`variantId`);
CREATE INDEX `idx_prompt_experiments_conversation_id` ON `prompt_experiments` (`conversationId`);
CREATE INDEX `idx_prompt_experiments_message_id` ON `prompt_experiments` (`messageId`);
CREATE INDEX `idx_prompt_interactions_user_id` ON `prompt_interactions` (`user_id`);
CREATE INDEX `idx_prompt_regression_runs_variant_id` ON `prompt_regression_runs` (`variant_id`);
CREATE INDEX `idx_propagation_actions_event_id` ON `propagation_actions` (`event_id`);
CREATE INDEX `idx_propagation_actions_actor_id` ON `propagation_actions` (`actor_id`);
CREATE INDEX `idx_propagation_events_source_entity_id` ON `propagation_events` (`source_entity_id`);
CREATE INDEX `idx_propagation_events_target_entity_id` ON `propagation_events` (`target_entity_id`);
CREATE INDEX `idx_quality_ratings_message_id` ON `quality_ratings` (`messageId`);
CREATE INDEX `idx_quality_ratings_conversation_id` ON `quality_ratings` (`conversationId`);
CREATE INDEX `idx_reasoning_traces_session_id` ON `reasoning_traces` (`session_id`);
CREATE INDEX `idx_recommendations_log_user_id` ON `recommendations_log` (`user_id`);
CREATE INDEX `idx_recommendations_log_advisor_id` ON `recommendations_log` (`advisor_id`);
CREATE INDEX `idx_recommendations_log_conversation_id` ON `recommendations_log` (`conversation_id`);
CREATE INDEX `idx_recommendations_log_message_id` ON `recommendations_log` (`message_id`);
CREATE INDEX `idx_recommendations_log_product_id` ON `recommendations_log` (`product_id`);
CREATE INDEX `idx_reconciliation_log_account_id` ON `reconciliation_log` (`account_id`);
CREATE INDEX `idx_rds_user_lead` ON `recruit_dimension_scores` (`user_id`,`lead_id`);
CREATE INDEX `idx_rds_tier` ON `recruit_dimension_scores` (`tier`);
CREATE INDEX `idx_rds_composite` ON `recruit_dimension_scores` (`composite_score`);
CREATE INDEX `idx_referrals_from_professional_id` ON `referrals` (`fromProfessionalId`);
CREATE INDEX `idx_referrals_to_coi_id` ON `referrals` (`toCoiId`);
CREATE INDEX `idx_referrals_client_id` ON `referrals` (`clientId`);
CREATE INDEX `idx_regulatory_impact_analyses_update_id` ON `regulatory_impact_analyses` (`update_id`);
CREATE INDEX `idx_report_jobs_user_id` ON `report_jobs` (`user_id`);
CREATE INDEX `idx_report_jobs_org_id` ON `report_jobs` (`org_id`);
CREATE INDEX `idx_report_jobs_template_id` ON `report_jobs` (`template_id`);
CREATE INDEX `idx_report_jobs_client_id` ON `report_jobs` (`client_id`);
CREATE INDEX `idx_report_templates_org_id` ON `report_templates` (`org_id`);
CREATE INDEX `idx_response_ratings_user_type` ON `response_ratings` (`user_id`,`response_type`);
CREATE INDEX `idx_review_queue_user_id` ON `review_queue` (`userId`);
CREATE INDEX `idx_review_queue_conversation_id` ON `review_queue` (`conversationId`);
CREATE INDEX `idx_review_queue_message_id` ON `review_queue` (`messageId`);
CREATE INDEX `idx_rich_media_message` ON `rich_media_embeds` (`message_id`);
CREATE INDEX `idx_role_elevations_user_id` ON `role_elevations` (`user_id`);
CREATE INDEX `idx_saved_analyses_user_id` ON `saved_analyses` (`user_id`);
CREATE INDEX `idx_saved_analyses_client_id` ON `saved_analyses` (`client_id`);
CREATE INDEX `idx_scrape_schedules_data_source_id` ON `scrape_schedules` (`data_source_id`);
CREATE INDEX `idx_self_discovery_history_user_id` ON `self_discovery_history` (`user_id`);
CREATE INDEX `idx_self_discovery_history_conversation_id` ON `self_discovery_history` (`conversation_id`);
CREATE INDEX `idx_self_discovery_history_trigger_message_id` ON `self_discovery_history` (`trigger_message_id`);
CREATE INDEX `idx_server_errors_user_id` ON `server_errors` (`user_id`);
CREATE INDEX `idx_shared_assumptions_owner` ON `shared_assumptions` (`owner_id`);
CREATE INDEX `idx_shared_assumptions_scope` ON `shared_assumptions` (`scope`,`scope_entity_id`);
CREATE INDEX `idx_snaptrade_accounts_user_id` ON `snaptrade_accounts` (`user_id`);
CREATE INDEX `idx_snaptrade_accounts_connection_id` ON `snaptrade_accounts` (`connection_id`);
CREATE INDEX `idx_snaptrade_accounts_snap_trade_account_id` ON `snaptrade_accounts` (`snaptrade_account_id`);
CREATE INDEX `idx_snaptrade_brokerage_connections_user_id` ON `snaptrade_brokerage_connections` (`user_id`);
CREATE INDEX `idx_snaptrade_brokerage_connections_snap_trade_user_id` ON `snaptrade_brokerage_connections` (`snaptrade_user_id`);
CREATE INDEX `idx_snaptrade_brokerage_connections_brokerage_authorization_id` ON `snaptrade_brokerage_connections` (`brokerage_authorization_id`);
CREATE INDEX `idx_snaptrade_positions_user_id` ON `snaptrade_positions` (`user_id`);
CREATE INDEX `idx_snaptrade_positions_account_id` ON `snaptrade_positions` (`account_id`);
CREATE INDEX `idx_snaptrade_users_user_id` ON `snaptrade_users` (`user_id`);
CREATE INDEX `idx_snaptrade_users_snap_trade_user_id` ON `snaptrade_users` (`snaptrade_user_id`);
CREATE INDEX `idx_student_loans_user_id` ON `student_loans` (`userId`);
CREATE INDEX `idx_study_progress_user_id` ON `study_progress` (`user_id`);
CREATE INDEX `idx_suitability_assessments_user_id` ON `suitability_assessments` (`userId`);
CREATE INDEX `idx_suitability_change_events_profile_id` ON `suitability_change_events` (`profile_id`);
CREATE INDEX `idx_suitability_dimensions_profile_id` ON `suitability_dimensions` (`profile_id`);
CREATE INDEX `idx_suitability_household_links_primary_user_id` ON `suitability_household_links` (`primary_user_id`);
CREATE INDEX `idx_suitability_household_links_linked_user_id` ON `suitability_household_links` (`linked_user_id`);
CREATE INDEX `idx_suitability_profiles_user_id` ON `suitability_profiles` (`user_id`);
CREATE INDEX `idx_suitability_profiles_organization_id` ON `suitability_profiles` (`organization_id`);
CREATE INDEX `idx_suitability_questions_queue_user_id` ON `suitability_questions_queue` (`user_id`);
CREATE INDEX `idx_sem_channel` ON `sync_event_metrics` (`channel`);
CREATE INDEX `idx_sem_location` ON `sync_event_metrics` (`location_id`);
CREATE INDEX `idx_sem_detected` ON `sync_event_metrics` (`detected_at`);
CREATE INDEX `idx_sem_event_type` ON `sync_event_metrics` (`event_type`);
CREATE INDEX `idx_sem_contact` ON `sync_event_metrics` (`contact_external_id`);
CREATE INDEX `idx_srh_status` ON `sync_run_history` (`status`);
CREATE INDEX `idx_srh_started` ON `sync_run_history` (`started_at`);
CREATE INDEX `idx_health_events_type` ON `system_health_events` (`health_event_type`,`health_severity`);
CREATE INDEX `idx_health_events_source` ON `system_health_events` (`source_name`);
CREATE INDEX `idx_tax_return_reviews_client` ON `tax_return_reviews` (`clientId`);
CREATE INDEX `idx_tax_return_reviews_advisor` ON `tax_return_reviews` (`advisorId`);
CREATE INDEX `idx_tax_return_reviews_year` ON `tax_return_reviews` (`taxYear`);
CREATE INDEX `idx_tax_return_reviews_status` ON `tax_return_reviews` (`status`);
CREATE INDEX `idx_template_opt_template_model` ON `template_optimization_results` (`template_id`,`model`);
CREATE INDEX `idx_transaction_categories_transaction_id` ON `transaction_categories` (`transaction_id`);
CREATE INDEX `idx_transaction_categories_user_id` ON `transaction_categories` (`user_id`);
CREATE INDEX `idx_underwriting_tracking_client` ON `underwriting_tracking` (`client_id`);
CREATE INDEX `idx_underwriting_tracking_status` ON `underwriting_tracking` (`status`);
CREATE INDEX `idx_usage_tracking_user_date` ON `usage_tracking` (`user_id`,`created_at`);
CREATE INDEX `idx_user_ai_boundaries_user_id` ON `user_ai_boundaries` (`user_id`);
CREATE INDEX `idx_audio_overrides_user_script` ON `user_audio_overrides` (`user_id`,`audio_script_id`);
CREATE INDEX `idx_user_autonomy_profiles_user_id` ON `user_autonomy_profiles` (`user_id`);
CREATE INDEX `idx_user_changelog_awareness_user_id` ON `user_changelog_awareness` (`user_id`);
CREATE INDEX `idx_user_changelog_awareness_changelog_id` ON `user_changelog_awareness` (`changelog_id`);
CREATE INDEX `idx_user_consents_user_id` ON `user_consents` (`user_id`);
CREATE INDEX `idx_user_feature_proficiency_user_id` ON `user_feature_proficiency` (`user_id`);
CREATE INDEX `idx_user_guardrails_user_id` ON `user_guardrails` (`user_id`);
CREATE INDEX `idx_user_insights_cache_user_id` ON `user_insights_cache` (`user_id`);
CREATE INDEX `idx_user_locations_user` ON `user_locations` (`user_id`);
CREATE INDEX `idx_user_locations_location` ON `user_locations` (`ghl_location_id`);
CREATE INDEX `idx_user_locations_unique` ON `user_locations` (`user_id`,`ghl_location_id`);
CREATE INDEX `idx_user_memories_user_cat` ON `user_memories` (`user_id`,`memory_category`);
CREATE INDEX `idx_user_organization_roles_user_id` ON `user_organization_roles` (`userId`);
CREATE INDEX `idx_user_organization_roles_organization_id` ON `user_organization_roles` (`organizationId`);
CREATE INDEX `idx_user_organization_roles_manager_id` ON `user_organization_roles` (`managerId`);
CREATE INDEX `idx_user_organization_roles_professional_id` ON `user_organization_roles` (`professionalId`);
CREATE INDEX `idx_user_platform_events_user_id` ON `user_platform_events` (`user_id`);
CREATE INDEX `idx_user_platform_events_session_id` ON `user_platform_events` (`session_id`);
CREATE INDEX `idx_user_profiles_user_id` ON `user_profiles` (`userId`);
CREATE INDEX `idx_user_relationships_user_id` ON `user_relationships` (`userId`);
CREATE INDEX `idx_user_relationships_related_user_id` ON `user_relationships` (`relatedUserId`);
CREATE INDEX `idx_user_relationships_organization_id` ON `user_relationships` (`organizationId`);
CREATE INDEX `idx_verification_schedules_professional_id` ON `verification_schedules` (`professional_id`);
CREATE INDEX `idx_view_as_audit_log_actor_id` ON `view_as_audit_log` (`actorId`);
CREATE INDEX `idx_view_as_audit_log_target_user_id` ON `view_as_audit_log` (`targetUserId`);
CREATE INDEX `idx_view_as_audit_log_organization_id` ON `view_as_audit_log` (`organizationId`);
CREATE INDEX `idx_view_shares_owner_id` ON `view_shares` (`owner_id`);
CREATE INDEX `idx_view_shares_shared_with_user` ON `view_shares` (`shared_with_user_id`);
CREATE INDEX `idx_view_shares_view_type` ON `view_shares` (`view_type`);
CREATE INDEX `idx_wha_user` ON `wealth_hub_allocations` (`user_id`);
CREATE INDEX `idx_wha_hub_type` ON `wealth_hub_allocations` (`hub_type`);
CREATE INDEX `idx_wha_default` ON `wealth_hub_allocations` (`is_default`);
CREATE INDEX `idx_web_scrape_results_data_source_id` ON `web_scrape_results` (`dataSourceId`);
CREATE INDEX `idx_web_scrape_results_ingestion_job_id` ON `web_scrape_results` (`ingestionJobId`);
CREATE INDEX `idx_weight_presets_user_id` ON `weight_presets` (`userId`);
CREATE INDEX `idx_workflow_checklist_user_id` ON `workflow_checklist` (`userId`);
CREATE INDEX `idx_workflow_checkpoints_workflow_id` ON `workflow_checkpoints` (`workflow_id`);
CREATE INDEX `idx_workflow_checkpoints_agent_run_id` ON `workflow_checkpoints` (`agent_run_id`);
CREATE INDEX `idx_workflow_execution_log_chain_id` ON `workflow_execution_log` (`chain_id`);
CREATE INDEX `idx_workflow_instances_user` ON `workflow_instances` (`user_id`);
CREATE INDEX `idx_workflow_instances_user_template` ON `workflow_instances` (`user_id`,`template_id`);
CREATE INDEX `idx_zip_demographics_county` ON `zip_code_demographics` (`county`);
CREATE INDEX `idx_zip_demographics_wealth` ON `zip_code_demographics` (`wealth_index`);

-- Stewardly v3 overlap-table column additions (additive only)
-- Generated by migrations/scripts/04_emit_overlap_alters.py
