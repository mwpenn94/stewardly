CREATE TABLE IF NOT EXISTS `access_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resource_type` varchar(128) NOT NULL,
	`required_attributes` json,
	`effect` enum('allow','deny') DEFAULT 'allow',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_policies_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ad_impression_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ad_id` int NOT NULL,
	`user_id` int,
	`session_id` varchar(100),
	`event_type` enum('impression','click','dismiss') NOT NULL,
	`context` varchar(200),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ad_impression_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ad_placements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placement_type` enum('contextual_banner','sponsored_content','product_recommendation','inline_cta') NOT NULL,
	`advertiser_name` varchar(200),
	`target_context` varchar(200),
	`content_html` text,
	`cta_url` varchar(500),
	`cta_text` varchar(100),
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`enabled` boolean DEFAULT true,
	`max_impressions` int,
	`start_date` date,
	`end_date` date,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ad_placements_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `advisory_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`executionType` enum('account_open','rebalance','harvest','transfer','trade','rollover') NOT NULL,
	`executionDataJson` json,
	`tax_impact_estimate` decimal(12,2),
	`gateStatus` enum('draft','pending_review','approved','executing','completed','failed') DEFAULT 'draft',
	`gateReviewId` int,
	`reviewerId` int,
	`approvedAt` bigint,
	`executedAt` bigint,
	`custodianConfirmation` varchar(255),
	`postExecutionAuditJson` json,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `advisory_executions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `affiliated_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`name` varchar(256) NOT NULL,
	`category` enum('carrier','lender','ria','advanced_markets','general_partner') NOT NULL,
	`description` text,
	`contactInfo` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliated_resources_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `agent_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentInstanceId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`targetSystem` varchar(255),
	`targetUrl` text,
	`dataAccessedSummary` text,
	`dataModifiedSummary` text,
	`screenshotHash` varchar(255),
	`complianceTier` int DEFAULT 1,
	`gate_triggered` boolean DEFAULT false,
	`gateResult` varchar(50),
	`durationMs` int,
	`errorMessage` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `agent_actions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `agent_autonomy_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_template_id` int NOT NULL,
	`current_level` int DEFAULT 1,
	`level_1_runs` int DEFAULT 0,
	`level_2_runs` int DEFAULT 0,
	`promoted_at` timestamp,
	`promoted_by` int,
	CONSTRAINT `agent_autonomy_levels_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `agent_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firmId` int,
	`workflowType` varchar(100) NOT NULL,
	`deploymentMode` enum('local','cloud','hybrid') DEFAULT 'local',
	`instanceStatus` enum('spawning','active','paused','terminated','error') DEFAULT 'spawning',
	`configJson` json,
	`budget_limit_usd` decimal(10,2),
	`runtimeLimitMinutes` int DEFAULT 60,
	`totalActions` int DEFAULT 0,
	`total_cost_usd` decimal(10,2) DEFAULT '0',
	`spawnedAt` bigint NOT NULL,
	`terminatedAt` bigint,
	CONSTRAINT `agent_instances_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `agent_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_template_id` int NOT NULL,
	`runs` int DEFAULT 0,
	`successes` int DEFAULT 0,
	`avg_duration_ms` int,
	`avg_cost_usd` float,
	`avg_satisfaction_score` float,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_performance_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `agent_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`steps_json` json,
	`category` varchar(64),
	`org_id` int,
	`is_built_in` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_templates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ai_config_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layer_type` enum('platform','organization','manager','professional','client') NOT NULL,
	`entity_id` int NOT NULL,
	`config` json,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ai_config_layers_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ai_response_quality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`conversation_id` int,
	`message_id` int,
	`response_empty` boolean DEFAULT false,
	`disclaimer_count` int DEFAULT 0,
	`tool_calls_attempted` int DEFAULT 0,
	`tool_calls_completed` int DEFAULT 0,
	`retry_count` int DEFAULT 0,
	`latency_ms` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_response_quality_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ai_tool_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tool_id` int NOT NULL,
	`conversation_id` int,
	`message_id` int,
	`user_id` int,
	`input_json` json,
	`output_json` json,
	`success` boolean NOT NULL DEFAULT true,
	`latency_ms` int,
	`user_modified_input` boolean NOT NULL DEFAULT false,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_tool_calls_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ai_tool_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`conversation_id` int,
	`message_id` int,
	`tool_name` varchar(100) NOT NULL,
	`tool_args` json NOT NULL,
	`tool_result` json,
	`auto_populated_fields` json,
	`execution_ms` int,
	`success` boolean DEFAULT true,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_tool_executions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ai_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tool_name` varchar(200) NOT NULL,
	`tool_type` enum('calculator','model','action','query','report') NOT NULL,
	`description` text NOT NULL,
	`input_schema` json NOT NULL,
	`output_schema` json,
	`trpc_procedure` varchar(200) NOT NULL,
	`requires_auth` boolean NOT NULL DEFAULT true,
	`requires_confirmation` boolean NOT NULL DEFAULT false,
	`usage_count` int NOT NULL DEFAULT 0,
	`success_rate` float DEFAULT 1,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_tools_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `analytical_models` (
	`id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`category` enum('risk','suitability','compliance','engagement','financial','behavioral','market','operational') NOT NULL,
	`input_schema` json,
	`output_schema` json,
	`dependencies` json,
	`version` varchar(20) DEFAULT '1.0.0',
	`is_active` boolean DEFAULT true,
	`execution_type` enum('llm','statistical','rule_based','hybrid') DEFAULT 'hybrid',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytical_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `analytical_models_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `annual_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`professional_id` int NOT NULL,
	`phase` enum('identify','prepare','schedule','conduct','document','followup') DEFAULT 'identify',
	`due_date` timestamp,
	`scheduled_date` timestamp,
	`completed_date` timestamp,
	`prep_report_json` text,
	`agenda_json` text,
	`meeting_summary` text,
	`action_items_json` text,
	`compliance_checklist` text,
	`status` enum('pending','scheduled','in_progress','completed','overdue') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annual_reviews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `assessment_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`assessment_type` varchar(64) NOT NULL,
	`status` enum('active','completed','abandoned','invalidated') NOT NULL DEFAULT 'active',
	`started_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	`ai_block_active` boolean NOT NULL DEFAULT true,
	`focus_loss_count` int NOT NULL DEFAULT 0,
	`ai_attempt_count` int NOT NULL DEFAULT 0,
	`score` float,
	`max_score` float,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `assessment_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `audio_scripts` (
	`id` varchar(36) NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`content_id` varchar(255) NOT NULL,
	`default_script` text NOT NULL,
	`default_script_ssml` text,
	`generated_by` varchar(50),
	`generated_at` timestamp,
	`listen_count` int DEFAULT 0,
	`avg_completion_rate` decimal(5,2),
	`clarity_score` decimal(3,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audio_scripts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `audio_study_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`track_slug` varchar(128) NOT NULL,
	`segment_id` varchar(255) NOT NULL,
	`segment_type` varchar(64) NOT NULL,
	`segment_title` varchar(512) NOT NULL,
	`duration_ms` int NOT NULL DEFAULT 0,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	`next_review_at` timestamp,
	`interval_days` float DEFAULT 1,
	`ease_factor` float DEFAULT 2.5,
	`repetitions` int DEFAULT 0,
	CONSTRAINT `audio_study_progress_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `audit_trail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`messageId` int,
	`action` varchar(128) NOT NULL,
	`details` text,
	`complianceFlags` json,
	`piiDetected` boolean DEFAULT false,
	`disclaimerAppended` boolean DEFAULT false,
	`reviewStatus` enum('auto_approved','pending_review','approved','rejected','modified') DEFAULT 'auto_approved',
	`reviewedBy` int,
	`reviewNotes` text,
	`entryHash` varchar(64),
	`previousHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_trail_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `auth_enrichment_log` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('linkedin','google','email','apollo','pdl','manus') NOT NULL,
	`event_type` enum('initial_signup','re_auth','token_refresh','manual_enrich','periodic_refresh') NOT NULL,
	`fields_captured` json NOT NULL,
	`fields_new` json NOT NULL,
	`fields_updated` json NOT NULL,
	`raw_response_hash` varchar(64) NOT NULL,
	`suitability_dimensions_updated` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_enrichment_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `auth_provider_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('linkedin','google') NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`token_expires_at` timestamp,
	`scopes_granted` json NOT NULL,
	`last_profile_fetch_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auth_provider_tokens_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `benchmark_aggregates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dimension` varchar(128) NOT NULL,
	`age_bracket` varchar(32),
	`income_bracket` varchar(32),
	`percentile_25` float,
	`percentile_50` float,
	`percentile_75` float,
	`sample_size` int DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `benchmark_aggregates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `benchmark_comparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`comparisonType` enum('retirement_readiness','savings_rate','debt_ratio','insurance_coverage','estate_planning','tax_efficiency','investment_returns','overall') NOT NULL,
	`clientValue` varchar(100),
	`peerMedian` varchar(100),
	`peerP25` varchar(100),
	`peerP75` varchar(100),
	`percentileRank` int,
	`peerGroupCriteria` json,
	`peerGroupSize` int,
	`dataSourceJson` json,
	`insightsJson` json,
	`planningNodeId` int,
	`goalId` int,
	`snapshotDate` bigint NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `benchmark_comparisons_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `beneficiary_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`policyOrAccountRef` varchar(255) NOT NULL,
	`accountType` enum('life_insurance','annuity','ira','401k','roth_ira','brokerage','trust','bank','other') NOT NULL,
	`carrierOrCustodian` varchar(255),
	`currentBeneficiariesJson` json,
	`proposedBeneficiariesJson` json,
	`reviewTrigger` enum('annual_review','life_event','estate_plan_change','divorce','death','new_policy','client_request','regulatory') DEFAULT 'annual_review',
	`lifeEventDescription` text,
	`estateAlignmentNotes` text,
	`taxImplicationsNotes` text,
	`perStirpesVsPerCapita` enum('per_stirpes','per_capita','not_applicable') DEFAULT 'not_applicable',
	`contingentBeneficiarySet` boolean DEFAULT false,
	`minorBeneficiaryProtection` text,
	`changeRequired` boolean DEFAULT false,
	`changeFormUrl` text,
	`changeSubmittedAt` bigint,
	`changeConfirmedAt` bigint,
	`status` enum('pending_review','reviewed','changes_needed','changes_submitted','confirmed','no_changes_needed') DEFAULT 'pending_review',
	`nextReviewDate` bigint,
	`planningNodeId` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `beneficiary_reviews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `billing_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`stripe_event_id` varchar(255) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`stripe_payment_intent_id` varchar(255),
	`stripe_invoice_id` varchar(255),
	`amount_cents` int,
	`currency` varchar(10) DEFAULT 'usd',
	`status` varchar(50),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `browser_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`agent_run_id` int,
	`target_url` text NOT NULL,
	`status` enum('initializing','active','completed','failed','timeout') NOT NULL DEFAULT 'initializing',
	`actions_log` json,
	`screenshots` json,
	`domain` varchar(255),
	`allowed` boolean NOT NULL DEFAULT false,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ended_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `browser_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `bulk_import_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_name` varchar(255) NOT NULL,
	`import_type` enum('csv_upload','api_bulk','multi_url_scrape','rss_feed','sitemap_crawl') NOT NULL,
	`total_items` int DEFAULT 0,
	`processed_items` int DEFAULT 0,
	`success_items` int DEFAULT 0,
	`failed_items` int DEFAULT 0,
	`status` enum('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
	`input_data` json,
	`results_json` json,
	`triggered_by` int,
	`started_at` bigint,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `bulk_import_batches_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `business_exit_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`business_name` varchar(256) NOT NULL,
	`business_type` varchar(128),
	`annual_revenue` float,
	`annual_profit` float,
	`employee_count` int,
	`owner_dependence_score` int,
	`readiness_score` int,
	`preferred_exit_path` varchar(64),
	`analysis_json` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_exit_plans_id` PRIMARY KEY(`id`)
);
