CREATE TABLE IF NOT EXISTS `passive_action_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`preference_id` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`action_type` varchar(50) NOT NULL,
	`status` enum('success','failed','skipped','partial') NOT NULL,
	`result_summary` text,
	`records_affected` int DEFAULT 0,
	`duration_ms` int,
	`error_message` text,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passive_action_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `passive_action_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`action_type` enum('auto_refresh','background_sync','monitoring_alerts','scheduled_reports','anomaly_detection','smart_enrichment') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`config_json` json,
	`last_triggered_at` timestamp,
	`trigger_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `passive_action_preferences_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pattern_transition_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_pattern` varchar(20) NOT NULL,
	`readiness_score` int DEFAULT 0,
	`recommendation` varchar(50),
	`rationale` text,
	`metrics_json` json,
	`gating_factors_json` json,
	`next_review_date` varchar(10),
	`assessed_at` bigint NOT NULL,
	CONSTRAINT `pattern_transition_assessments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `peer_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` varchar(30) NOT NULL DEFAULT 'member',
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peer_group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_pgm_unique` UNIQUE(`group_id`,`user_id`)
);

CREATE TABLE IF NOT EXISTS `peer_group_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peer_group_messages_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `peer_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`track_id` int,
	`created_by` int NOT NULL,
	`max_members` int NOT NULL DEFAULT 20,
	`current_members` int NOT NULL DEFAULT 0,
	`is_compliance_gated` boolean NOT NULL DEFAULT true,
	`required_role` varchar(30) NOT NULL DEFAULT 'advisor',
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peer_groups_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric_name` varchar(255) NOT NULL,
	`metric_category` enum('latency','throughput','error_rate','availability','ai_quality','user_satisfaction') NOT NULL,
	`value` float NOT NULL,
	`unit` varchar(50),
	`tags` json,
	`sla_target` float,
	`sla_met` boolean,
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `permission_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_id` int NOT NULL,
	`target_user_id` int,
	`target_org_id` int,
	`action_type` varchar(50) NOT NULL,
	`feature_id` varchar(100),
	`previous_value` text,
	`new_value` text,
	`reason` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permission_audit_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `personal_financial_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int NOT NULL,
	`planning_node_id` int,
	`review_type` enum('initial','annual','life_event','regulatory','ad_hoc') NOT NULL,
	`review_date` date NOT NULL,
	`document_url` varchar(2000),
	`document_key` varchar(500),
	`sections_included` json,
	`calculator_outputs_snapshot` json,
	`goal_hierarchy_snapshot` json,
	`recommendations_snapshot` json,
	`advisor_approved_at` timestamp,
	`client_acknowledged_at` timestamp,
	`e_signature_id` int,
	`suitability_documentation` json,
	`compliance_review_status` enum('pending','approved','flagged','escalated') DEFAULT 'pending',
	`compliance_reviewer_id` int,
	`compliance_review_date` timestamp,
	`retention_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_financial_reviews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pfm_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`source` varchar(30) NOT NULL,
	`filename` varchar(255),
	`total_rows` int DEFAULT 0,
	`imported_rows` int DEFAULT 0,
	`skipped_rows` int DEFAULT 0,
	`date_range_start` varchar(10),
	`date_range_end` varchar(10),
	`category_breakdown` text,
	`warnings` text,
	`status` varchar(20) DEFAULT 'completed',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pfm_imports_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pfr_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int NOT NULL,
	`root_planning_node_id` int,
	`pfr_version` int NOT NULL DEFAULT 1,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','review','approved','delivered','archived') NOT NULL DEFAULT 'draft',
	`executive_summary` text,
	`sections_json` json,
	`assumptions_snapshot` json,
	`goals_snapshot` json,
	`recommendations_snapshot` json,
	`references_snapshot` json,
	`reasoning_chains_snapshot` json,
	`alternatives_snapshot` json,
	`implementation_sequence` json,
	`compliance_attestation` json,
	`pdf_url` varchar(2000),
	`audio_narration_url` varchar(2000),
	`delivered_at` timestamp,
	`next_review_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pfr_documents_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plaid_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`account_id` varchar(100) NOT NULL,
	`security_id` varchar(100),
	`ticker` varchar(20),
	`name` varchar(200),
	`quantity` varchar(20),
	`cost_basis` varchar(20),
	`current_value` varchar(20),
	`last_synced` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_holdings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plaid_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_id` varchar(255) NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`institution_id` varchar(100),
	`institution_name` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`consent_expires_at` bigint,
	`last_synced_at` bigint,
	`error_code` varchar(100),
	`error_message` text,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `plaid_items_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plaid_webhook_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_id` varchar(100),
	`webhook_type` varchar(50) NOT NULL,
	`webhook_code` varchar(50) NOT NULL,
	`error_code` varchar(50),
	`processed_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_webhook_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plaid_webhooks_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_type` varchar(128) NOT NULL,
	`item_id` varchar(256),
	`payload` json,
	`processed_at` timestamp,
	`status` enum('received','processing','processed','failed') DEFAULT 'received',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_webhooks_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plan_actual_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int,
	`analysis_period_start` date,
	`analysis_period_end` date,
	`overall_status` enum('ahead','on_track','behind','at_risk'),
	`gdc_variance_pct` decimal(6,2),
	`key_findings` json,
	`recommendations` json,
	`benchmark_comparison` json,
	`generated_at` timestamp DEFAULT (now()),
	CONSTRAINT `plan_actual_insights_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `plan_adherence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('savings','spending','investment','debt','insurance','estate') NOT NULL,
	`targetValue` float,
	`actualValue` float,
	`adherenceScore` float,
	`trend` enum('improving','stable','declining') DEFAULT 'stable',
	`lastNudgeTier` enum('none','gentle','contextual','advisor_alert','plan_revision') DEFAULT 'none',
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_adherence_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `planning_assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`assumption_scope` enum('platform','firm','advisor','client') DEFAULT 'advisor',
	`scope_entity_id` int,
	`inflation_rate` decimal(5,4),
	`equity_return` decimal(5,4),
	`bond_return` decimal(5,4),
	`risk_free_rate` decimal(5,4),
	`tax_bracket_federal` decimal(5,4),
	`tax_bracket_state` decimal(5,4),
	`capital_gains_rate` decimal(5,4),
	`estate_exemption` decimal(14,2),
	`sofr_rate` decimal(5,4),
	`mortality_table` varchar(100),
	`custom_assumptions` json,
	`assumption_source` enum('manual','fred_api','market_data','firm_default') DEFAULT 'manual',
	`effective_date` date,
	`expires_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_assumptions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `planning_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`level` enum('platform','region','team','advisor','client','goal','strategy','implementation') NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` int NOT NULL,
	`owner_id` int NOT NULL,
	`label` varchar(500),
	`forward_target` decimal(14,2),
	`forward_target_date` date,
	`forward_milestones` json,
	`forward_assumptions` json,
	`backward_required_input` decimal(14,2),
	`backward_required_date` date,
	`backward_steps` json,
	`current_value` decimal(14,2),
	`gap_value` decimal(14,2),
	`gap_percentage` decimal(6,2),
	`node_trend` enum('improving','stable','declining') DEFAULT 'stable',
	`probability_of_success` decimal(5,2),
	`reasoning_chain` json,
	`alternatives_considered` json,
	`suitability_score` decimal(5,2),
	`compliance_flags` json,
	`last_review_date` date,
	`next_review_date` date,
	`node_status` enum('draft','active','review','archived') DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_nodes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `planning_references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planning_node_id` int NOT NULL,
	`ref_type` enum('regulatory','academic','carrier','market_data','case_law','internal','illustration','fact_sheet') NOT NULL,
	`title` varchar(500) NOT NULL,
	`citation` text,
	`url` varchar(2000),
	`relevance` text,
	`date_accessed` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planning_references_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `planning_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`snapshot_date` varchar(20),
	`snapshot_type` varchar(50) DEFAULT 'manual',
	`label` varchar(255),
	`nodes_json` json,
	`goals_json` json,
	`metrics_json` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `planning_snapshots_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `platform_ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(64) NOT NULL DEFAULT 'default',
	`baseSystemPrompt` text,
	`defaultTone` varchar(64) DEFAULT 'professional',
	`defaultResponseFormat` varchar(64) DEFAULT 'mixed',
	`defaultResponseLength` varchar(64) DEFAULT 'standard',
	`modelPreferences` json,
	`ensembleWeights` json,
	`globalGuardrails` json,
	`prohibitedTopics` json,
	`maxTokensDefault` int DEFAULT 4096,
	`temperatureDefault` float DEFAULT 0.7,
	`enabledFocusModes` json,
	`platformDisclaimer` text,
	`defaultTtsVoice` varchar(64),
	`defaultSpeechRate` float,
	`defaultAutoPlayVoice` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_ai_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_ai_settings_settingKey_unique` UNIQUE(`settingKey`)
);

CREATE TABLE IF NOT EXISTS `platform_changelog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`feature_keys` json,
	`change_type` enum('new_feature','improvement','fix','removal') NOT NULL,
	`impacted_roles` json,
	`announced_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_changelog_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `platform_kv` (
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `platform_kv_key` PRIMARY KEY(`key`)
);

CREATE TABLE IF NOT EXISTS `platform_learnings` (
	`id` varchar(36) NOT NULL,
	`learning_type` enum('pattern','anomaly','trend','correlation','best_practice','risk_factor') NOT NULL,
	`category` varchar(64),
	`description` text NOT NULL,
	`evidence` json,
	`confidence` float,
	`impact_score` float,
	`applicable_layer` enum('platform','organization','manager','professional','user'),
	`action_recommendation` text,
	`status` enum('detected','validated','applied','rejected','expired') DEFAULT 'detected',
	`applied_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_learnings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `policy_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`policyNumber` varchar(255) NOT NULL,
	`carrierName` varchar(255) NOT NULL,
	`productType` varchar(100) NOT NULL,
	`faceAmount` bigint,
	`annualPremium` bigint,
	`deliveryMethod` enum('in_person','mail','electronic','video_call') DEFAULT 'in_person',
	`deliveredAt` bigint,
	`clientAcknowledgedAt` bigint,
	`freeLookStartDate` bigint,
	`freeLookEndDate` bigint,
	`freeLookDays` int DEFAULT 10,
	`freeLookStatus` enum('not_started','active','expired','exercised') DEFAULT 'not_started',
	`freeLookExercisedAt` bigint,
	`deliveryReceiptUrl` text,
	`clientSignatureUrl` text,
	`notesJson` json,
	`status` enum('pending_delivery','delivered','acknowledged','free_look_active','placed','returned') DEFAULT 'pending_delivery',
	`planningNodeId` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `policy_deliveries_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `portal_engagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_date` date NOT NULL,
	`login_count` int DEFAULT 0,
	`time_spent_seconds` int DEFAULT 0,
	`pages_visited` int DEFAULT 0,
	`features_used` text,
	`goals_checked` int DEFAULT 0,
	`actions_completed` int DEFAULT 0,
	`engagement_score` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `portal_engagement_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `practice_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`firmId` int,
	`periodEndDate` timestamp NOT NULL,
	`organicGrowthRate` float,
	`netNewClients` int,
	`revenuePerClient` float,
	`costToServeJson` json,
	`attritionRiskClientsJson` json,
	`engagementScoresJson` json,
	`benchmarkPercentilesJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_metrics_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `predictive_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger_type` varchar(128) NOT NULL,
	`condition_json` json,
	`action_type` varchar(64) NOT NULL,
	`action_json` json,
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictive_triggers_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `premium_finance_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`insurancePolicyRef` varchar(255),
	`financedPremiumAnnual` decimal(15,2),
	`loanAmount` decimal(15,2),
	`lenderName` varchar(255),
	`interestRate` decimal(5,3),
	`termYears` int,
	`collateralType` varchar(100),
	`collateralValue` decimal(15,2),
	`structureJson` json,
	`stressTestJson` json,
	`gateStatus` enum('modeling','pending_review','approved','applied','funded','monitoring','closed') DEFAULT 'modeling',
	`gateReviewId` int,
	`status` enum('modeling','applied','funded','monitoring','closed') DEFAULT 'modeling',
	`monitoringAlertsJson` json,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `premium_finance_cases_id` PRIMARY KEY(`id`)
);
