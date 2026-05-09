CREATE TABLE `access_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resource_type` varchar(128) NOT NULL,
	`required_attributes` json,
	`effect` enum('allow','deny') DEFAULT 'allow',
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_impression_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ad_id` int NOT NULL,
	`user_id` int,
	`session_id` varchar(100),
	`event_type` enum('impression','click','dismiss') NOT NULL,
	`context` varchar(200),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `ad_impression_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_placements` (
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
--> statement-breakpoint
CREATE TABLE `advisory_executions` (
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
--> statement-breakpoint
CREATE TABLE `affiliated_resources` (
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
--> statement-breakpoint
CREATE TABLE `agent_actions` (
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
--> statement-breakpoint
CREATE TABLE `agent_autonomy_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_template_id` int NOT NULL,
	`current_level` int DEFAULT 1,
	`level_1_runs` int DEFAULT 0,
	`level_2_runs` int DEFAULT 0,
	`promoted_at` timestamp,
	`promoted_by` int,
	CONSTRAINT `agent_autonomy_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_instances` (
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
--> statement-breakpoint
CREATE TABLE `agent_performance` (
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
--> statement-breakpoint
CREATE TABLE `agent_templates` (
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
--> statement-breakpoint
CREATE TABLE `ai_config_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layer_type` enum('platform','organization','manager','professional','client') NOT NULL,
	`entity_id` int NOT NULL,
	`config` json,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ai_config_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_response_quality` (
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
--> statement-breakpoint
CREATE TABLE `ai_tool_calls` (
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
--> statement-breakpoint
CREATE TABLE `ai_tool_executions` (
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
--> statement-breakpoint
CREATE TABLE `ai_tools` (
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
--> statement-breakpoint
CREATE TABLE `analytical_models` (
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
--> statement-breakpoint
CREATE TABLE `annual_reviews` (
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
--> statement-breakpoint
CREATE TABLE `app_installs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`app_id` int NOT NULL,
	`user_id` int NOT NULL,
	`install_source` enum('created','public_catalog','share_link') NOT NULL DEFAULT 'created',
	`share_link_token` varchar(64),
	`installed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_installs_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_installs_user_app_uniq` UNIQUE(`user_id`,`app_id`)
);
--> statement-breakpoint
CREATE TABLE `app_share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`app_id` int NOT NULL,
	`created_by_user_id` int NOT NULL,
	`expires_at` timestamp,
	`max_installs` int,
	`use_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_share_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `assessment_sessions` (
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
--> statement-breakpoint
CREATE TABLE `audio_scripts` (
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
--> statement-breakpoint
CREATE TABLE `audio_study_progress` (
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
--> statement-breakpoint
CREATE TABLE `audit_trail` (
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
--> statement-breakpoint
CREATE TABLE `auth_enrichment_log` (
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
--> statement-breakpoint
CREATE TABLE `auth_provider_tokens` (
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
--> statement-breakpoint
CREATE TABLE `benchmark_aggregates` (
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
--> statement-breakpoint
CREATE TABLE `benchmark_comparisons` (
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
--> statement-breakpoint
CREATE TABLE `beneficiary_reviews` (
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
--> statement-breakpoint
CREATE TABLE `billing_events` (
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
--> statement-breakpoint
CREATE TABLE `browser_sessions` (
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
--> statement-breakpoint
CREATE TABLE `bulk_import_batches` (
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
--> statement-breakpoint
CREATE TABLE `business_exit_plans` (
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
--> statement-breakpoint
CREATE TABLE `business_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_year` int NOT NULL,
	`plan_quarter` int,
	`role_segment` enum('new_associate','experienced_professional','managing_director','rvp','affiliate_a','affiliate_b','affiliate_c','affiliate_d','strategic_partner'),
	`income_target` decimal(12,2),
	`gdc_target` decimal(12,2),
	`gdc_bracket` decimal(5,2),
	`product_mix` json,
	`funnel_targets` json,
	`channel_budget` json,
	`aum_existing` decimal(14,2),
	`aum_new_target` decimal(14,2),
	`team_size_target` int DEFAULT 0,
	`back_plan_mode` varchar(50),
	`back_plan_target` decimal(14,2),
	`plan_source` enum('manual','calculator_import','ai_generated') DEFAULT 'manual',
	`plan_status` enum('draft','active','archived') DEFAULT 'draft',
	`approved_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `business_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cadence_compliance_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`audit_id` varchar(100) NOT NULL,
	`audit_type` enum('daily_random','monthly_full','ad_hoc') NOT NULL,
	`touch_log_id` int,
	`grade` enum('Pass','Conditional Pass','Fail') NOT NULL,
	`findings_json` json,
	`remediation_json` json,
	`auditor_notes` text,
	`created_at` bigint NOT NULL,
	CONSTRAINT `cadence_compliance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cadence_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`cadence_id` varchar(100) NOT NULL,
	`cadence_status` enum('active','paused','completed','stopped','opted_out') DEFAULT 'active',
	`current_touch_number` int DEFAULT 0,
	`total_touches` int NOT NULL,
	`enrolled_at` bigint NOT NULL,
	`paused_at` bigint,
	`pause_reason` varchar(255),
	`completed_at` bigint,
	`stopped_at` bigint,
	`stop_reason` varchar(255),
	`next_touch_due_at` bigint,
	`esi_pre_approval_id` varchar(100),
	`esi_pre_approval_expiry` bigint,
	`anti_rebate_verified` boolean DEFAULT false,
	`metadata` json,
	CONSTRAINT `cadence_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cadence_opt_out_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`opt_out_channel` varchar(50) NOT NULL,
	`scope` varchar(50) NOT NULL DEFAULT 'all_channels',
	`opt_out_text` text,
	`opt_out_at` bigint NOT NULL,
	`processed_by` varchar(100),
	`reference_id` varchar(100),
	CONSTRAINT `cadence_opt_out_registry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cadence_touch_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`cadence_id` varchar(100) NOT NULL,
	`touch_number` int NOT NULL,
	`channel` varchar(50) NOT NULL,
	`touch_status` enum('drafted','approved','sent','delivered','opened','replied','bounced','failed','skipped') DEFAULT 'drafted',
	`subject_line` varchar(500),
	`body_preview` text,
	`esi_pre_approval_id` varchar(100),
	`compliance_grade` enum('Pass','Conditional Pass','Fail'),
	`compliance_notes` text,
	`sent_at` bigint,
	`delivered_at` bigint,
	`opened_at` bigint,
	`replied_at` bigint,
	`reply_classification` varchar(50),
	`reply_analysis_json` json,
	`created_at` bigint NOT NULL,
	CONSTRAINT `cadence_touch_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculator_result_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(100),
	`user_id` int,
	`calculator_type` varchar(100),
	`inputs_hash` varchar(64),
	`inputs` json,
	`results` json,
	`insight_text` text,
	`created_at` timestamp DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `calculator_result_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculator_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`calculator_type` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`inputs_json` json,
	`results_json` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calculator_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capability_modes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`system_prompt_additions` text,
	`required_knowledge_categories` json,
	`available_tools` json,
	`available_models` json,
	`default_for_roles` json,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capability_modes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_key` varchar(255) NOT NULL,
	`item_type` varchar(32) NOT NULL,
	`rating` int NOT NULL,
	`reviewed_at` timestamp DEFAULT (now()),
	`elapsed_days` float NOT NULL DEFAULT 0,
	`scheduled_days` float NOT NULL DEFAULT 0,
	`stability_before` float,
	`stability_after` float,
	`difficulty_before` float,
	`difficulty_after` float,
	`state_before` varchar(16),
	`state_after` varchar(16),
	`feature_flag` enum('control','fsrs5') NOT NULL DEFAULT 'fsrs5',
	CONSTRAINT `card_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_key` varchar(255) NOT NULL,
	`item_type` varchar(32) NOT NULL,
	`stability` float NOT NULL DEFAULT 0.4,
	`difficulty` float NOT NULL DEFAULT 0.3,
	`elapsed_days` float NOT NULL DEFAULT 0,
	`scheduled_days` float NOT NULL DEFAULT 0,
	`reps` int NOT NULL DEFAULT 0,
	`lapses` int NOT NULL DEFAULT 0,
	`state` enum('new','learning','review','relearning') NOT NULL DEFAULT 'new',
	`last_review` timestamp,
	`next_due` timestamp,
	`feature_flag` enum('control','fsrs5') NOT NULL DEFAULT 'fsrs5',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `card_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carrier_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`carrierName` varchar(255) NOT NULL,
	`connectionType` enum('api','browser') DEFAULT 'browser',
	`apiEndpoint` varchar(500),
	`credentialsVaultRef` varchar(255),
	`supportedOperationsJson` json,
	`stateAppointmentsJson` json,
	`lastVerified` bigint,
	`active` boolean DEFAULT true,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `carrier_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carrier_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote_id` int,
	`carrier_id` int,
	`submission_method` enum('api','pdf','manual') DEFAULT 'manual',
	`status` enum('draft','submitted','accepted','rejected','pending') DEFAULT 'draft',
	`submitted_at` timestamp,
	`response_received_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `carrier_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ce_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`track_id` int NOT NULL,
	`credits_earned` varchar(10) NOT NULL DEFAULT '0',
	`credit_type` varchar(50) NOT NULL DEFAULT 'self_serve',
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`issued_at` timestamp,
	`expires_at` timestamp,
	`certificate_url` varchar(500),
	`issuer` varchar(200) NOT NULL DEFAULT 'Stewardly Learning Platform',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ce_credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapter_prerequisites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapter_id` int NOT NULL,
	`prerequisite_chapter_id` int NOT NULL,
	`min_mastery_score` float NOT NULL DEFAULT 0.7,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chapter_prerequisites_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_cp_unique` UNIQUE(`chapter_id`,`prerequisite_chapter_id`)
);
--> statement-breakpoint
CREATE TABLE `client_associations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`organizationId` int,
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_associations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_discovery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`values_priorities` json,
	`risk_attitudes` json,
	`family_dynamics` json,
	`health_status` json,
	`employer_benefits` json,
	`existing_documents` json,
	`anticipated_life_events` json,
	`preferred_contact_method` varchar(50),
	`preferred_meeting_frequency` varchar(50),
	`preferred_report_detail_level` enum('summary','standard','detailed') DEFAULT 'standard',
	`completeness_score` decimal(5,2),
	`last_discovery_date` date,
	`next_discovery_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_discovery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`planning_node_id` int,
	`goal_category` enum('protection','retirement','estate','tax','education','debt','growth','business','cash_flow','premium_finance','ilit','exec_comp','charitable','legacy','healthcare') NOT NULL,
	`goal_name` varchar(255) NOT NULL,
	`goal_description` text,
	`target_amount` decimal(14,2),
	`current_amount` decimal(14,2),
	`target_date` date,
	`time_horizon_years` int,
	`priority_rank` int,
	`probability_of_success` decimal(5,2),
	`confidence_interval_low` decimal(14,2),
	`confidence_interval_high` decimal(14,2),
	`depends_on_goals` json,
	`conflicts_with_goals` json,
	`goal_status` enum('identified','agreed','in_progress','on_track','at_risk','achieved','deferred','abandoned') DEFAULT 'identified',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_plan_outcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`plan_area` enum('protection','retirement','estate','tax','education','debt','growth','business','cash_flow','premium_finance','ilit','exec_comp','charitable') NOT NULL,
	`plan_date` date,
	`target_metric` varchar(200),
	`target_value` decimal(14,2),
	`current_value` decimal(14,2),
	`gap_value` decimal(14,2),
	`back_plan_mode` varchar(100),
	`recommended_products` json,
	`implementation_status` enum('recommended','in_progress','partial','complete','declined','deferred') DEFAULT 'recommended',
	`review_date` date,
	`outcome_source` enum('manual','calculator_backplan','ai_generated','suitability_assessment') DEFAULT 'manual',
	CONSTRAINT `client_plan_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`valueScore` float DEFAULT 0,
	`growthScore` float DEFAULT 0,
	`engagementScore` float DEFAULT 0,
	`relationshipScore` float DEFAULT 0,
	`totalScore` float DEFAULT 0,
	`tier` enum('platinum','gold','silver','bronze') DEFAULT 'silver',
	`serviceModelJson` json,
	`previousTier` enum('platinum','gold','silver','bronze'),
	`lastClassified` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coa_actuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`spend_actual` decimal(12,2),
	`channel_performance` json,
	`leads_generated` int,
	`appointments_set` int,
	`cases_from_campaign` int,
	`gdc_from_campaign` decimal(12,2),
	`roi_calculated` decimal(8,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `coa_actuals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coa_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_name` varchar(200) NOT NULL,
	`campaign_type` enum('wealthbridge','wta','regional','individual') DEFAULT 'individual',
	`region` varchar(100),
	`target_segment` varchar(100),
	`start_date` date,
	`end_date` date,
	`budget_total` decimal(12,2),
	`channel_allocation` json,
	`target_metrics` json,
	`campaign_status` enum('planning','active','paused','completed','archived') DEFAULT 'planning',
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `coa_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_messages` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int,
	`message_type` enum('nudge','celebration','reminder','education','insight','alert') NOT NULL,
	`category` varchar(64),
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('critical','high','medium','low') DEFAULT 'medium',
	`trigger_event` varchar(128),
	`status` enum('pending','delivered','read','acted','dismissed') DEFAULT 'pending',
	`delivered_at` timestamp,
	`read_at` timestamp,
	`expires_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coi_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`firmId` int,
	`name` varchar(256) NOT NULL,
	`coiFirm` varchar(256),
	`specialty` enum('cpa','attorney','insurance_agent','mortgage_broker','real_estate','other') NOT NULL,
	`contactJson` json,
	`relationshipStrength` enum('strong','moderate','new') DEFAULT 'new',
	`referralsSent` int DEFAULT 0,
	`referralsReceived` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coi_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coi_disclosures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`advisor_id` int,
	`org_id` int,
	`disclosure_type` enum('compensation','affiliation','ownership','referral','other') NOT NULL,
	`description` text NOT NULL,
	`related_product_id` int,
	`related_recommendation_id` int,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','disclosed','acknowledged','resolved') NOT NULL DEFAULT 'pending',
	`disclosed_at` timestamp,
	`acknowledged_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coi_disclosures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comms_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`client_id` int,
	`template_id` varchar(128),
	`channel` enum('email','sms','letter','portal_message') DEFAULT 'email',
	`category` varchar(64),
	`subject` varchar(512),
	`body` text,
	`status` enum('draft','sent','scheduled','failed') DEFAULT 'draft',
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`compliance_flags` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `comms_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_archive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`session_id` varchar(100),
	`content_type` enum('calculator_insight','chat_response','protection_score_analysis','pre_meeting_brief','plan_analysis') NOT NULL,
	`content_text` text,
	`calculator_type` varchar(100),
	`lead_id` int,
	`generated_at` timestamp DEFAULT (now()),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`retention_expires_at` timestamp,
	CONSTRAINT `communication_archive_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author_id` int NOT NULL,
	`community_type` enum('advisor_forum','product_discussion','practice_mgmt','market_commentary','new_advisor_support') NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text,
	`replies_count` int DEFAULT 0,
	`likes_count` int DEFAULT 0,
	`pinned` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`author_id` int NOT NULL,
	`content` text,
	`likes_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compensation_brackets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bracket_name` varchar(100) NOT NULL,
	`gdc_min` decimal(12,2),
	`gdc_max` decimal(12,2),
	`commission_rate` decimal(5,2),
	`role_segment` varchar(100),
	`effective_date` date,
	CONSTRAINT `compensation_brackets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`classification` enum('general_education','product_discussion','personalized_recommendation','investment_advice') NOT NULL,
	`confidenceScore` float NOT NULL,
	`flagsJson` json,
	`reasoningChainJson` json,
	`modificationsJson` json,
	`reviewTier` enum('auto_approved','auto_modified','human_review','blocked') NOT NULL,
	`reviewerId` int,
	`modelVersion` varchar(64),
	`promptHash` varchar(64),
	`deliveryStatus` enum('delivered','held','blocked','modified') DEFAULT 'delivered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_audit_samples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`review_period` varchar(50),
	`sample_size` int,
	`selected_accounts_json` json,
	`review_type` varchar(50) DEFAULT 'random',
	`findings_json` json,
	`supervisor_id` int,
	`review_date` varchar(20),
	`status` varchar(50) DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_audit_samples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_flags` (
	`id` varchar(36) NOT NULL,
	`reviewId` varchar(36) NOT NULL,
	`ruleCode` varchar(50) NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`description` text,
	`severity` varchar(20) NOT NULL DEFAULT 'warning',
	`auto_fixed` boolean DEFAULT false,
	`fixApplied` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `compliance_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_action_id` int,
	`predicted_risk_score` int,
	`risk_factors` json,
	`prediction_model_version` varchar(32),
	`requires_approval` boolean DEFAULT false,
	`approved` boolean,
	`approved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_prescreening` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`conversation_id` int NOT NULL,
	`check_type` enum('unsuitable_recommendation','promissory_language','unauthorized_practice','concentration_risk','missing_disclosure') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'low',
	`details` text,
	`action_taken` enum('passed','warning_injected','held_for_review') DEFAULT 'passed',
	`reviewed_by` int,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_prescreening_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_reviews` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`organization_id` varchar(255),
	`review_type` varchar(50) NOT NULL DEFAULT 'content_review',
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`content_hash` varchar(64),
	`original_content` text,
	`flagged_issues` text,
	`applied_fixes` text,
	`severity` varchar(20) DEFAULT 'low',
	`reviewer_id` varchar(255),
	`reviewed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `compliance_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rule_type` enum('tcpa','can_spam','finra','sec','state','fcra','ccpa','aml') NOT NULL,
	`rule_name` varchar(200) NOT NULL,
	`description` text,
	`check_function` varchar(200),
	`applies_to` json,
	`penalty_description` text,
	`enabled` boolean DEFAULT true,
	CONSTRAINT `compliance_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_weekly_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`week_start` date NOT NULL,
	`brief_json` json,
	`distributed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_weekly_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consent_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`consent_type` enum('ai_chat','voice','doc_upload','data_sharing','marketing','analytics','third_party') NOT NULL,
	`granted` boolean NOT NULL DEFAULT false,
	`granted_at` timestamp,
	`revoked_at` timestamp,
	`ip_address` varchar(45),
	`user_agent` text,
	`version` varchar(50) NOT NULL DEFAULT '1.0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consent_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `constitutional_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int,
	`principle_number` int NOT NULL,
	`principle_text` text,
	`violation_description` text,
	`severity` enum('low','medium','high') DEFAULT 'low',
	`original_response_hash` varchar(64),
	`corrected_response_hash` varchar(64),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `constitutional_violations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultation_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`professional_id` int NOT NULL,
	`scheduled_at` timestamp NOT NULL,
	`duration_minutes` int DEFAULT 30,
	`pre_brief_id` int,
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`daily_room_url` varchar(512),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultation_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200),
	`title` varchar(200) NOT NULL,
	`content` text,
	`excerpt` text,
	`author_name` varchar(100),
	`author_credentials` varchar(200),
	`category` enum('insurance','retirement','estate','tax','investing','business','education','general','calculator_faq') DEFAULT 'general',
	`tags` json,
	`seo_title` varchar(70),
	`seo_description` varchar(160),
	`published_at` timestamp,
	`views` int DEFAULT 0,
	`leads_generated` int DEFAULT 0,
	`article_status` enum('draft','review','published','archived') DEFAULT 'draft',
	CONSTRAINT `content_articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `content_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_type` varchar(50) NOT NULL,
	`content_id` varchar(100) NOT NULL,
	`owner_id` int NOT NULL,
	`shared_with_user_id` int,
	`shared_with_org_id` int,
	`shared_with_role` enum('user','advisor','manager','admin'),
	`permission_level` enum('view','comment','edit','admin') NOT NULL DEFAULT 'view',
	`expires_at` timestamp,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `context_assembly_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`message_id` int,
	`layer` varchar(64) NOT NULL,
	`items_considered` int DEFAULT 0,
	`items_included` int DEFAULT 0,
	`items_pruned` int DEFAULT 0,
	`token_budget` int,
	`tokens_used` int,
	`complexity_level` enum('simple','moderate','complex') DEFAULT 'moderate',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `context_assembly_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_compliance_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`score` int DEFAULT 100,
	`checks_run` int DEFAULT 0,
	`checks_passed` int DEFAULT 0,
	`flagged_for_review` boolean DEFAULT false,
	`last_updated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_compliance_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(32) DEFAULT '#6366f1',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`message_id` int,
	`topic` varchar(128) NOT NULL,
	`previous_topic` varchar(128),
	`disclaimer_injected` boolean DEFAULT false,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) DEFAULT 'New Conversation',
	`mode` enum('client','coach','manager') NOT NULL DEFAULT 'client',
	`pinned` boolean NOT NULL DEFAULT false,
	`folderId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`organizationId` int,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`pull_date` varchar(20) NOT NULL,
	`credit_score` int,
	`score_model` varchar(50),
	`utilization_percent` varchar(10),
	`total_debt` varchar(20),
	`open_accounts` int,
	`derogatory_marks` int,
	`hard_inquiries` int,
	`oldest_account_years` int,
	`consent_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`direction` enum('push','pull') NOT NULL,
	`crm_provider` varchar(128) NOT NULL,
	`records_synced` int DEFAULT 0,
	`sync_type` varchar(64),
	`status` enum('started','completed','failed') DEFAULT 'started',
	`error_details` text,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_access_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adapter_id` varchar(50) NOT NULL,
	`action` varchar(100) NOT NULL,
	`user_id` int NOT NULL,
	`client_id` int,
	`request_params` text,
	`response_status` varchar(20) NOT NULL,
	`latency_ms` int,
	`timestamp` bigint NOT NULL,
	CONSTRAINT `data_access_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_authorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int NOT NULL,
	`data_scope` varchar(100) NOT NULL,
	`consent_language` text,
	`state_jurisdiction` varchar(50),
	`granted_at` bigint NOT NULL,
	`expires_at` bigint,
	`revoked_at` bigint,
	`status` varchar(20) DEFAULT 'active',
	CONSTRAINT `data_authorizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_freshness_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(100) NOT NULL,
	`data_category` varchar(100) NOT NULL,
	`last_refreshed_at` timestamp,
	`next_refresh_at` timestamp,
	`refresh_interval_hours` int DEFAULT 24,
	`record_count` int DEFAULT 0,
	`status` enum('fresh','stale','refreshing','error','paused') DEFAULT 'fresh',
	`consecutive_failures` int DEFAULT 0,
	`max_consecutive_failures` int DEFAULT 3,
	`last_error_message` text,
	`auto_paused` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_freshness_registry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_quality_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data_source_id` int NOT NULL,
	`ingestion_job_id` int,
	`completeness` decimal(5,2) DEFAULT '0.00',
	`accuracy` decimal(5,2) DEFAULT '0.00',
	`freshness` decimal(5,2) DEFAULT '0.00',
	`consistency` decimal(5,2) DEFAULT '0.00',
	`overall_score` decimal(5,2) DEFAULT '0.00',
	`issues_found` json,
	`recommendations` json,
	`scored_at` bigint NOT NULL,
	CONSTRAINT `data_quality_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int,
	`name` varchar(255) NOT NULL,
	`sourceType` enum('document_upload','web_scrape','api_feed','market_data','regulatory','product_catalog','news_feed','competitor','custom') NOT NULL,
	`url` varchar(1000),
	`authType` enum('none','api_key','oauth','basic','bearer') DEFAULT 'none',
	`credentialsVaultRef` varchar(255),
	`scheduleCron` varchar(100),
	`priority` int DEFAULT 5,
	`is_active` boolean DEFAULT true,
	`lastRunAt` bigint,
	`lastSuccessAt` bigint,
	`totalRecordsIngested` int DEFAULT 0,
	`configJson` json,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `data_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_value_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(50) NOT NULL,
	`record_id` varchar(100) NOT NULL,
	`current_score` decimal(8,2) DEFAULT '0.00',
	`last_scored_at` timestamp,
	`refresh_priority` enum('critical','high','normal','low','dormant') DEFAULT 'normal',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_value_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delegator_id` int NOT NULL,
	`delegate_id` int NOT NULL,
	`scope` json,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`active` boolean DEFAULT true,
	CONSTRAINT `delegations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployment_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`check_type` varchar(64) NOT NULL,
	`passed` boolean DEFAULT false,
	`details` text,
	`duration_ms` int,
	`run_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deployment_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(64) NOT NULL,
	`description` text,
	`tests_passed` int,
	`tests_total` int,
	`bundle_size_kb` int,
	`rollout_percentage` int DEFAULT 5,
	`status` enum('deploying','canary','rolling_out','complete','rolled_back') DEFAULT 'deploying',
	`error_rate` float,
	`previous_version` varchar(64),
	`deployed_by` int,
	`deployed_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `deployment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digital_asset_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assetType` enum('crypto_wallet','exchange_account','brokerage','bank','social_media','email','cloud_storage','loyalty_program','domain','digital_content','other') NOT NULL,
	`platform` varchar(256) NOT NULL,
	`approximateValue` float,
	`accessMethod` text,
	`hasAccessPlan` boolean DEFAULT false,
	`legacyContactSet` boolean DEFAULT false,
	`lastVerified` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digital_asset_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disclaimer_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`disclaimer_id` int NOT NULL,
	`disclaimer_version` int DEFAULT 1,
	`shown_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disclaimer_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disclaimer_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` enum('shown','scrolled','clicked','acknowledged') DEFAULT 'shown',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disclaimer_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disclaimer_id` int NOT NULL,
	`language` varchar(10) NOT NULL,
	`translated_text` text NOT NULL,
	`verified_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disclaimer_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(128) NOT NULL,
	`disclaimer_text` text NOT NULL,
	`version` int DEFAULT 1,
	`effective_date` timestamp NOT NULL DEFAULT (now()),
	`superseded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`highlightText` text,
	`highlightStart` int,
	`highlightEnd` int,
	`annotationType` enum('comment','highlight','question','action_item','ai_insight') NOT NULL DEFAULT 'comment',
	`parentId` int,
	`resolved` boolean DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`chunkIndex` int NOT NULL,
	`category` enum('personal_docs','financial_products','regulations','training_materials','artifacts','skills') NOT NULL DEFAULT 'personal_docs',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_extractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`documentId` int,
	`ingestionJobId` int,
	`extractionType` enum('financial_statement','tax_return','insurance_policy','investment_statement','bank_statement','pay_stub','estate_document','medical_record','custom') NOT NULL,
	`extractedData` json NOT NULL,
	`extractedEntities` json,
	`extractedAmounts` json,
	`extraction_confidence` decimal(3,2) DEFAULT '0.80',
	`pageCount` int,
	`processingTimeMs` int,
	`llmModelUsed` varchar(100),
	`createdAt` bigint NOT NULL,
	CONSTRAINT `document_extractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_tag_map` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_tag_map_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(32) DEFAULT '#6366f1',
	`isAiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int,
	`name` varchar(255) NOT NULL,
	`category` enum('compliance','client_report','proposal','agreement','disclosure','meeting_notes','review','planning','custom') NOT NULL DEFAULT 'custom',
	`description` text,
	`template_body` text NOT NULL,
	`variables` json,
	`output_format` enum('pdf','docx','html') NOT NULL DEFAULT 'pdf',
	`is_system` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`version` int NOT NULL DEFAULT 1,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`filename` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(128),
	`extractedText` text,
	`chunkCount` int DEFAULT 0,
	`sizeBytes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int,
	`filename` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(128),
	`category` enum('personal_docs','financial_products','regulations','training_materials','artifacts','skills') NOT NULL DEFAULT 'personal_docs',
	`visibility` enum('private','professional','management','admin') NOT NULL DEFAULT 'professional',
	`extractedText` text,
	`chunkCount` int DEFAULT 0,
	`status` enum('uploading','processing','ready','error') NOT NULL DEFAULT 'uploading',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dripify_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(100),
	`payload` json,
	`processed` boolean DEFAULT false,
	`lead_pipeline_id` int,
	`received_at` timestamp DEFAULT (now()),
	`processed_at` timestamp,
	CONSTRAINT `dripify_webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economic_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(20) NOT NULL,
	`metric_name` varchar(50) NOT NULL,
	`value` varchar(20),
	`source` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economic_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `education_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('budgeting','investing','insurance','tax','estate','retirement','debt','credit','real_estate','general') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`estimatedMinutes` int DEFAULT 5,
	`content` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `education_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `education_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` int NOT NULL,
	`assignedBy` varchar(64) DEFAULT 'system',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`score` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `education_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `education_triggers` (
	`id` varchar(36) NOT NULL,
	`trigger_condition` json NOT NULL,
	`education_module_id` int,
	`target_audience` enum('all','new_users','professionals','managers','admins') DEFAULT 'all',
	`title` varchar(256) NOT NULL,
	`content` text,
	`content_url` text,
	`delivery_method` enum('in_app','chat_injection','notification','email') DEFAULT 'in_app',
	`priority` int DEFAULT 50,
	`is_active` boolean DEFAULT true,
	`times_triggered` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `education_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body_html` text NOT NULL,
	`body_text` text,
	`template_id` varchar(100),
	`status` enum('draft','scheduled','sending','sent','paused','cancelled') DEFAULT 'draft',
	`recipient_filter` json,
	`total_recipients` int DEFAULT 0,
	`sent_count` int DEFAULT 0,
	`open_count` int DEFAULT 0,
	`click_count` int DEFAULT 0,
	`bounce_count` int DEFAULT 0,
	`scheduled_at` bigint,
	`sent_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`recipient_email` varchar(320) NOT NULL,
	`recipient_name` varchar(255),
	`status` enum('pending','sent','delivered','opened','clicked','bounced','failed') DEFAULT 'pending',
	`sent_at` bigint,
	`opened_at` bigint,
	`clicked_at` bigint,
	`error_message` text,
	`created_at` bigint NOT NULL,
	CONSTRAINT `email_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `embed_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advisor_id` int NOT NULL,
	`calculator_type` varchar(100) NOT NULL,
	`embed_domain` varchar(200),
	`theme` varchar(20) DEFAULT 'dark',
	`custom_cta` text,
	`leads_generated` int DEFAULT 0,
	`embed_compliance_approved` boolean DEFAULT false,
	`enabled` boolean DEFAULT true,
	CONSTRAINT `embed_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `encrypted_fields_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`table_name` varchar(128) NOT NULL,
	`column_name` varchar(128) NOT NULL,
	`encryption_method` varchar(64) DEFAULT 'AES-256-GCM',
	`key_alias` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encrypted_fields_registry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `encryption_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key_alias` varchar(128) NOT NULL,
	`status` enum('active','rotating','retired') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`rotated_at` timestamp,
	`retired_at` timestamp,
	CONSTRAINT `encryption_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagement_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int NOT NULL,
	`client_name` varchar(255) NOT NULL,
	`advisor_name` varchar(255) NOT NULL,
	`firm_name` varchar(255) NOT NULL,
	`scope_json` json,
	`fee_schedule_json` json,
	`fiduciary_standard` varchar(50) DEFAULT 'fiduciary',
	`engagement_type` varchar(50) DEFAULT 'initial',
	`effective_date` varchar(20),
	`term_months` int DEFAULT 12,
	`auto_renew` boolean DEFAULT true,
	`termination_notice_days` int DEFAULT 30,
	`form_crs_json` json,
	`adv_delivery_json` json,
	`privacy_policy_delivered` boolean DEFAULT false,
	`arbitration_clause` boolean DEFAULT false,
	`status` varchar(50) DEFAULT 'draft',
	`letter_html` text,
	`letter_markdown` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagement_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagement_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`client_id` int,
	`organization_id` int,
	`login_frequency` float DEFAULT 0,
	`meeting_cadence` float DEFAULT 0,
	`response_time_avg` float DEFAULT 0,
	`portal_activity` float DEFAULT 0,
	`overall_score` float DEFAULT 0,
	`risk_level` enum('healthy','at_risk','critical') NOT NULL DEFAULT 'healthy',
	`period_start` timestamp,
	`period_end` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagement_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrichment_cohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`matchCriteria` json NOT NULL,
	`enrichmentFields` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_cohorts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrichment_datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`applicableDomains` json,
	`dataType` varchar(64),
	`matchDimensions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrichment_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`datasetId` int NOT NULL,
	`cohortId` int NOT NULL,
	`matchFields` json,
	`confidenceScore` float DEFAULT 0,
	`applicableDomains` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entity_resolution_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern` varchar(512) NOT NULL,
	`canonical_entity_id` int NOT NULL,
	`confidence` float DEFAULT 0.9,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_resolution_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equity_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`grantType` enum('iso','nso','rsu','espp') NOT NULL,
	`company` varchar(256) NOT NULL,
	`grantDate` timestamp,
	`vestingSchedule` json,
	`exercisePrice` float,
	`currentFMV` float,
	`sharesGranted` int,
	`sharesVested` int DEFAULT 0,
	`sharesExercised` int DEFAULT 0,
	`expirationDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equity_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`from_level` int NOT NULL,
	`to_level` int NOT NULL,
	`reason` text,
	`decided_by` varchar(50),
	`decided_at` timestamp DEFAULT (now()),
	CONSTRAINT `escalation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `esignature_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`client_user_id` int,
	`envelope_id` varchar(100) NOT NULL,
	`provider` varchar(20) NOT NULL,
	`document_type` varchar(100),
	`status` varchar(20) NOT NULL DEFAULT 'created',
	`sent_at` bigint,
	`signed_at` bigint,
	`completed_at` bigint,
	`related_product_id` int,
	`related_quote_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `esignature_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estate_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`documentType` enum('trust','will','poa_financial','poa_healthcare','directive','beneficiary_audit') NOT NULL,
	`draftVersion` int DEFAULT 1,
	`draftContentUrl` text,
	`draftContentHash` varchar(255),
	`complexityLevel` enum('simple','standard','complex') DEFAULT 'standard',
	`reviewPath` enum('self_help','attorney_review') DEFAULT 'attorney_review',
	`attorneyId` int,
	`attorneyStatus` enum('pending','reviewing','approved','revision_requested') DEFAULT 'pending',
	`stateJurisdiction` varchar(10),
	`finalized` boolean DEFAULT false,
	`executedDate` bigint,
	`archiveRef` varchar(255),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `estate_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`existingPolicyNumber` varchar(255),
	`existingCarrier` varchar(255),
	`existingProductType` varchar(100),
	`existingCashValue` bigint,
	`existingSurrenderValue` bigint,
	`existingSurrenderCharge` bigint,
	`existingDeathBenefit` bigint,
	`existingAnnualPremium` bigint,
	`existingLoanBalance` bigint,
	`existingCostBasis` bigint,
	`existingFeaturesJson` json,
	`proposedCarrier` varchar(255),
	`proposedProductType` varchar(100),
	`proposedDeathBenefit` bigint,
	`proposedAnnualPremium` bigint,
	`proposedFeaturesJson` json,
	`proposedIllustrationUrl` text,
	`comparisonJson` json,
	`taxImplicationsJson` json,
	`surrenderChargeAnalysis` text,
	`suitabilityRationale` text,
	`replacementFormRequired` boolean DEFAULT true,
	`stateReplacementRules` text,
	`naicComplianceJson` json,
	`recommendationSummary` text,
	`recommendationAction` enum('exchange','keep_existing','supplement','needs_further_review'),
	`status` enum('draft','analysis_complete','client_reviewed','approved','submitted','completed','cancelled') DEFAULT 'draft',
	`planningNodeId` int,
	`goalId` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `exchange_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`org_id` int,
	`format` enum('csv','excel','pdf','docx','json') NOT NULL DEFAULT 'csv',
	`entity_type` varchar(100) NOT NULL,
	`filters` json,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`file_url` text,
	`file_key` text,
	`row_count` int DEFAULT 0,
	`error_message` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extraction_plan_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`provider` varchar(50) NOT NULL,
	`job_type` varchar(50),
	`scheduled_day` int,
	`requests_allocated` int,
	`records_target` int,
	`records_completed` int DEFAULT 0,
	`status` enum('pending','running','completed','failed','skipped') DEFAULT 'pending',
	`error_log` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extraction_plan_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extraction_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_name` varchar(200) NOT NULL,
	`plan_type` enum('initial_seed','scheduled_refresh','on_demand','ai_suggested') NOT NULL,
	`total_records` int DEFAULT 0,
	`estimated_duration_hours` decimal(8,2),
	`plan_json` json,
	`optimization_notes` json,
	`status` enum('draft','approved','running','completed','paused','failed') DEFAULT 'draft',
	`approved_by` int,
	`started_at` timestamp,
	`completed_at` timestamp,
	`records_completed` int DEFAULT 0,
	`records_failed` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extraction_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fairness_test_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demographic` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`prompt_text` text NOT NULL,
	`expected_behavior` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` bigint NOT NULL,
	CONSTRAINT `fairness_test_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fairness_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_id` int NOT NULL,
	`prompt_id` int NOT NULL,
	`response` text,
	`tone_score` float,
	`quality_score` float,
	`bias_indicators` json,
	`disclaimer_present` boolean DEFAULT false,
	`response_time_ms` int,
	`created_at` bigint NOT NULL,
	CONSTRAINT `fairness_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fairness_test_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_by` int NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`total_prompts` int DEFAULT 0,
	`completed_prompts` int DEFAULT 0,
	`overall_score` float,
	`bias_detected` boolean DEFAULT false,
	`summary` json,
	`findings` json,
	`recommendations` json,
	`started_at` bigint,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `fairness_test_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flagKey` varchar(128) NOT NULL,
	`label` varchar(256) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`scope` enum('platform','organization') NOT NULL DEFAULT 'platform',
	`organizationId` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`),
	CONSTRAINT `feature_flags_flagKey_unique` UNIQUE(`flagKey`)
);
--> statement-breakpoint
CREATE TABLE `feature_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`org_id` int,
	`role_scope` enum('user','advisor','manager','admin','org_default'),
	`feature_id` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`disclosure_ceiling` int NOT NULL DEFAULT 4,
	`granted_by` int,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_sharing_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`field_name` varchar(128) NOT NULL,
	`share_with_role` varchar(32),
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `field_sharing_controls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_chunks` (
	`id` varchar(36) NOT NULL,
	`file_id` varchar(36) NOT NULL,
	`chunk_index` int NOT NULL,
	`content` text NOT NULL,
	`content_type` enum('text','table','image_description','header','metadata') DEFAULT 'text',
	`token_count` int,
	`embedding` json,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_derived_enrichments` (
	`id` varchar(36) NOT NULL,
	`file_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`enrichment_type` enum('suitability_signal','risk_indicator','product_match','compliance_flag','financial_metric','life_event') NOT NULL,
	`dimension_key` varchar(64),
	`extracted_value` json,
	`confidence` float,
	`applied_to_profile` boolean DEFAULT false,
	`applied_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_derived_enrichments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_uploads` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int,
	`connection_id` varchar(36),
	`filename` varchar(512) NOT NULL,
	`mime_type` varchar(128),
	`size_bytes` bigint,
	`storage_url` text,
	`storage_key` varchar(512),
	`stage` enum('uploaded','validated','parsed','enriched','indexed','complete','failed') DEFAULT 'uploaded',
	`stage_error` text,
	`category` enum('personal_docs','financial_products','regulations','training','artifacts','skills','carrier_report','client_data','compliance') DEFAULT 'personal_docs',
	`visibility` enum('private','professional','management','admin') DEFAULT 'private',
	`metadata` json,
	`parsed_content` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `file_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`profile_json` json NOT NULL,
	`source` varchar(32) DEFAULT 'user',
	`completeness` float,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_profiles_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `uniq_financial_profiles_user` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `financial_protection_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`session_id` varchar(100),
	`email_hash` varchar(64),
	`phone_hash` varchar(64),
	`first_name` varchar(100),
	`overall_score` int,
	`dimension_scores` json,
	`improvement_priorities` json,
	`product_recommendations` json,
	`advisor_matched` boolean DEFAULT false,
	`advisor_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `financial_protection_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gate_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` varchar(255) NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`complianceTier` int NOT NULL DEFAULT 1,
	`classificationRationale` text,
	`reviewerId` int,
	`reviewerLicenseNumber` varchar(100),
	`reviewerLicenseState` varchar(10),
	`reviewerLicenseExpiry` bigint,
	`decision` enum('pending','approved','modified','rejected','escalated') DEFAULT 'pending',
	`modificationDetails` text,
	`complianceNotes` text,
	`decisionTimestamp` bigint,
	`archiveRef` varchar(255),
	`workflowType` varchar(100),
	`clientId` int,
	`professionalId` int,
	`firmId` int,
	`slaDeadline` bigint,
	`escalatedTo` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `gate_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generated_documents` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int,
	`template_slug` varchar(100) NOT NULL,
	`title` varchar(512) NOT NULL,
	`format` enum('pdf','docx','xlsx','csv','json','html') NOT NULL,
	`storage_url` text,
	`storage_key` varchar(512),
	`input_data` json,
	`status` enum('generating','complete','failed') DEFAULT 'generating',
	`error_message` text,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ghl_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_id` varchar(100) NOT NULL,
	`name` varchar(256) NOT NULL,
	`region` varchar(128),
	`organization_id` int,
	`is_active` boolean DEFAULT true,
	`sync_direction` enum('bidirectional','pull_only','push_only','disabled') DEFAULT 'bidirectional',
	`sync_frequency` enum('hourly','every_6h','daily','weekly','manual') DEFAULT 'daily',
	`conflict_policy` enum('ghl_wins','stewardly_wins','newest_wins','manual_review') DEFAULT 'newest_wins',
	`max_contacts_per_run` int DEFAULT 0,
	`rate_limit_ms` int DEFAULT 50,
	`api_key_encrypted` text,
	`last_sync_at` bigint,
	`last_sync_cursor` varchar(255),
	`last_sync_status` enum('success','partial','failed','running'),
	`total_contacts` int DEFAULT 0,
	`linked_contacts` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ghl_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `ghl_locations_location_id_unique` UNIQUE(`location_id`)
);
--> statement-breakpoint
CREATE TABLE `glossary_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term` varchar(200) NOT NULL,
	`slug` varchar(200),
	`definition` text,
	`glossary_category` enum('insurance','retirement','estate','tax','investment','business','general') DEFAULT 'general',
	`related_calculator` varchar(100),
	CONSTRAINT `glossary_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `glossary_terms_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `health_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_score` int NOT NULL DEFAULT 0,
	`spend_score` int NOT NULL DEFAULT 0,
	`save_score` int NOT NULL DEFAULT 0,
	`borrow_score` int NOT NULL DEFAULT 0,
	`plan_score` int NOT NULL DEFAULT 0,
	`status` enum('healthy','coping','vulnerable') NOT NULL DEFAULT 'coping',
	`insights_json` text,
	`recommendations_json` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hnw_narrative_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`wealth_signal_strength` varchar(20),
	`funnel_fit` varchar(20),
	`engagement_difficulty` varchar(20),
	`summary_paragraph` text,
	`recommended_cadence` varchar(100),
	`personalization_json` json,
	`compliance_flags_json` json,
	`scored_at` bigint NOT NULL,
	CONSTRAINT `hnw_narrative_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hypothesis_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hypothesis_id` int NOT NULL,
	`session_id` int,
	`quality_before` json,
	`quality_after` json,
	`regression_detected` boolean NOT NULL DEFAULT false,
	`cost_delta` float,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hypothesis_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_field_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`import_source` varchar(100),
	`column_mappings` json,
	`default_values` json,
	`created_by` int,
	`is_system` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `import_field_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`import_source` enum('dripify_webhook','dripify_csv','linkedin_csv','linkedin_sales_nav','smsit_api','smsit_csv','ghl_sync','manual_csv','manual_xlsx','manual_json','manual_xml','manual_vcf','bulk_zip','other') NOT NULL,
	`file_name` varchar(500),
	`file_size_bytes` bigint,
	`total_records` int DEFAULT 0,
	`records_imported` int DEFAULT 0,
	`records_skipped` int DEFAULT 0,
	`records_failed` int DEFAULT 0,
	`records_updated` int DEFAULT 0,
	`import_status` enum('pending','parsing','validating','importing','enriching','scoring','complete','failed','cancelled') DEFAULT 'pending',
	`started_at` timestamp,
	`completed_at` timestamp,
	`imported_by` int,
	`error_log` json,
	`field_mapping` json,
	`import_config` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `import_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvement_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`audit_id` int NOT NULL,
	`layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`direction` varchar(30) NOT NULL DEFAULT 'system_infrastructure',
	`action_type` enum('auto_implement','recommend','escalate','monitor') NOT NULL,
	`category` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`implementation_plan` text,
	`config_changes` json,
	`before_state` json,
	`after_state` json,
	`status` enum('proposed','approved','implementing','implemented','rejected','failed','rolled_back') NOT NULL DEFAULT 'proposed',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`estimated_impact` varchar(256),
	`actual_impact` text,
	`approved_by` int,
	`approved_at` bigint,
	`rejected_by` int,
	`rejected_at` bigint,
	`rejection_reason` text,
	`implemented_at` bigint,
	`implemented_by` varchar(64),
	`rolled_back_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `improvement_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvement_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`helpful` boolean DEFAULT true,
	`notes` text,
	`created_at` bigint NOT NULL,
	CONSTRAINT `improvement_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvement_hypotheses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signal_id` int NOT NULL,
	`pass_type` varchar(50) NOT NULL,
	`scope` json,
	`hypothesis_text` text NOT NULL,
	`expected_delta` float,
	`credit_budget` float,
	`status` varchar(30) NOT NULL DEFAULT 'pending',
	`test_count` int NOT NULL DEFAULT 0,
	`timeout_at` timestamp,
	`promoted_at` timestamp,
	`rejected_at` timestamp,
	`rejected_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `improvement_hypotheses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improvement_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signal_type` varchar(50) NOT NULL,
	`severity` varchar(20) NOT NULL,
	`source_metric` varchar(100),
	`source_value` text,
	`threshold` varchar(100),
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	`resolved_by_hypothesis_id` int,
	CONSTRAINT `improvement_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `industry_benchmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`benchmark_category` varchar(100) NOT NULL,
	`benchmark_name` varchar(200) NOT NULL,
	`benchmark_value` varchar(20),
	`benchmark_unit` varchar(50),
	`reporting_period` varchar(20),
	`source` varchar(100),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `industry_benchmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingested_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataSourceId` int NOT NULL,
	`ingestionJobId` int,
	`recordType` enum('customer_profile','organization','product','market_price','regulatory_update','news_article','competitor_intel','document_extract','entity','metric') NOT NULL,
	`entityId` varchar(255),
	`title` varchar(500),
	`contentSummary` text,
	`structuredData` json,
	`rawDataUrl` text,
	`confidence_score` decimal(3,2) DEFAULT '0.80',
	`freshnessAt` bigint,
	`tags` json,
	`is_verified` boolean DEFAULT false,
	`verifiedBy` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `ingested_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insight_type` enum('trend','anomaly','opportunity','risk','recommendation','competitive_intel','market_shift','regulatory_change') NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`data_source_ids` json,
	`related_entity_ids` json,
	`actionable` boolean DEFAULT true,
	`acknowledged` boolean DEFAULT false,
	`acknowledged_by` int,
	`expires_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `ingestion_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataSourceId` int NOT NULL,
	`triggeredBy` int,
	`status` enum('queued','running','completed','failed','cancelled') DEFAULT 'queued',
	`progressPct` int DEFAULT 0,
	`recordsProcessed` int DEFAULT 0,
	`recordsCreated` int DEFAULT 0,
	`recordsUpdated` int DEFAULT 0,
	`recordsSkipped` int DEFAULT 0,
	`recordsErrored` int DEFAULT 0,
	`errorLog` text,
	`startedAt` bigint,
	`completedAt` bigint,
	`durationMs` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `ingestion_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insight_id` int NOT NULL,
	`action_type` enum('task_created','notification_sent','alert_escalated','review_scheduled','auto_dismissed') NOT NULL,
	`action_payload` json,
	`assigned_to` int,
	`status` enum('pending','in_progress','completed','dismissed') DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`due_at` bigint,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `insight_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int,
	`carrierName` varchar(255) NOT NULL,
	`productName` varchar(255),
	`applicationDataJson` json,
	`preliminaryUwAssessment` text,
	`compliancePreflightJson` json,
	`gateStatus` enum('draft','pending_review','approved','submitted','issued','declined','counter_offer') DEFAULT 'draft',
	`gateReviewId` int,
	`reviewerId` int,
	`reviewerLicense` varchar(100),
	`reviewedAt` bigint,
	`submittedAt` bigint,
	`carrierStatus` varchar(100),
	`carrierRefNumber` varchar(255),
	`pendingRequirementsJson` json,
	`policyNumber` varchar(255),
	`issuedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `insurance_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_carriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrier_name` varchar(200) NOT NULL,
	`carrier_name_aliases` json,
	`am_best_id` varchar(50),
	`am_best_fsr` varchar(10),
	`am_best_fsr_numeric` int,
	`am_best_outlook` varchar(20),
	`sp_rating` varchar(10),
	`moodys_rating` varchar(10),
	`fitch_rating` varchar(10),
	`naic_id` varchar(20),
	`domicile_state` varchar(2),
	`company_type` varchar(20),
	`year_founded` int,
	`total_assets_billions` varchar(20),
	`statutory_surplus_billions` varchar(20),
	`complaint_ratio` varchar(10),
	`product_lines` json,
	`rating_last_updated` varchar(20),
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insurance_carriers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrier_id` int NOT NULL,
	`product_name` varchar(200) NOT NULL,
	`product_type` varchar(50) NOT NULL,
	`product_category` varchar(30) NOT NULL,
	`features` json,
	`min_face_amount` varchar(20),
	`max_face_amount` varchar(20),
	`min_issue_age` int,
	`max_issue_age` int,
	`underwriting_types` json,
	`riders_available` json,
	`state_availability` json,
	`compulife_product_id` varchar(50),
	`active` boolean DEFAULT true,
	`last_rate_update` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insurance_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int,
	`quoteRunId` varchar(255) NOT NULL,
	`carrierName` varchar(255) NOT NULL,
	`productType` varchar(100) NOT NULL,
	`productName` varchar(255),
	`premiumMonthly` decimal(12,2),
	`premiumAnnual` decimal(12,2),
	`deathBenefit` decimal(15,2),
	`cashValueYr10` decimal(15,2),
	`cashValueYr20` decimal(15,2),
	`ridersJson` json,
	`uwClassEstimated` varchar(100),
	`amBestRating` varchar(10),
	`quoteDate` bigint NOT NULL,
	`source` enum('api','browser','manual') DEFAULT 'manual',
	`status` enum('illustrative','reviewed','selected','expired') DEFAULT 'illustrative',
	`comparisonNotes` text,
	CONSTRAINT `insurance_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_analysis_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_url` varchar(500) NOT NULL,
	`domain` varchar(200) NOT NULL,
	`robots_txt` text,
	`rate_headers_found` json,
	`source_classification` varchar(50),
	`ai_recommendation` json,
	`admin_adjusted` boolean DEFAULT false,
	`admin_final_config` json,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_analysis_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_blueprint_runs` (
	`id` varchar(36) NOT NULL,
	`blueprint_id` varchar(36) NOT NULL,
	`blueprint_version` int NOT NULL DEFAULT 1,
	`triggered_by` int,
	`trigger_source` varchar(30) NOT NULL DEFAULT 'manual',
	`dry_run` boolean DEFAULT false,
	`status` varchar(20) NOT NULL DEFAULT 'queued',
	`records_fetched` int DEFAULT 0,
	`records_parsed` int DEFAULT 0,
	`records_transformed` int DEFAULT 0,
	`records_validated` int DEFAULT 0,
	`records_written` int DEFAULT 0,
	`records_skipped` int DEFAULT 0,
	`records_errored` int DEFAULT 0,
	`error_log` text,
	`warnings` json,
	`output_summary` json,
	`started_at` bigint NOT NULL,
	`completed_at` bigint,
	`duration_ms` int,
	CONSTRAINT `integration_blueprint_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_blueprint_samples` (
	`id` varchar(36) NOT NULL,
	`blueprint_id` varchar(36) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`raw_sample` text,
	`raw_format` varchar(20),
	`inferred_schema` json NOT NULL,
	`record_count` int NOT NULL DEFAULT 0,
	`source_hash` varchar(64),
	`fetched_at` bigint NOT NULL,
	CONSTRAINT `integration_blueprint_samples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_blueprint_versions` (
	`id` varchar(36) NOT NULL,
	`blueprint_id` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`snapshot_json` json NOT NULL,
	`change_note` text,
	`created_by` int,
	`created_at` bigint NOT NULL,
	CONSTRAINT `integration_blueprint_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_bpv_blueprint_version` UNIQUE(`blueprint_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `integration_blueprints` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`owner_id` int,
	`organization_id` int,
	`ownership_tier` varchar(20) NOT NULL DEFAULT 'professional',
	`visibility` varchar(20) NOT NULL DEFAULT 'private',
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`source_kind` varchar(20) NOT NULL,
	`source_config` json NOT NULL,
	`auth_config` json,
	`extraction_config` json NOT NULL,
	`transform_steps` json NOT NULL,
	`validation_rules` json,
	`sink_config` json NOT NULL,
	`schedule_cron` varchar(100),
	`rate_limit_per_min` int DEFAULT 60,
	`max_records_per_run` int DEFAULT 10000,
	`current_version` int NOT NULL DEFAULT 1,
	`ai_drafted` boolean DEFAULT false,
	`ai_drafted_by` varchar(100),
	`tags` json,
	`last_run_at` bigint,
	`last_run_status` varchar(20),
	`last_run_error` text,
	`total_runs` int DEFAULT 0,
	`total_records_ingested` int DEFAULT 0,
	`created_by` int,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `integration_blueprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_health_checks` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`provider_id` varchar(36) NOT NULL,
	`check_type` enum('connectivity','auth','data_freshness','rate_limit','schema_drift') NOT NULL,
	`status` enum('healthy','degraded','unhealthy','unknown') NOT NULL,
	`latency_ms` int,
	`response_code` int,
	`error_message` text,
	`metadata` json,
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_health_summary` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`overall_status` enum('healthy','degraded','unhealthy','unknown') DEFAULT 'unknown',
	`uptime_percent` decimal(5,2) DEFAULT '0',
	`avg_latency_ms` int,
	`checks_total` int DEFAULT 0,
	`checks_healthy` int DEFAULT 0,
	`checks_failed` int DEFAULT 0,
	`last_healthy_at` timestamp,
	`last_unhealthy_at` timestamp,
	`consecutive_failures` int DEFAULT 0,
	`data_freshness_minutes` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_health_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_improvement_log` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36),
	`provider_id` varchar(36),
	`action_type` enum('auto_reconnect','key_rotation_reminder','rate_limit_backoff','schema_migration','data_quality_alert','performance_optimization','degradation_detected','recovery_confirmed','user_notification','ai_context_updated','feature_suggestion') NOT NULL,
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`description` text,
	`suggested_action` text,
	`action_taken` text,
	`resolved_at` timestamp,
	`resolved_by` varchar(100),
	`ai_generated` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_improvement_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_optimization_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycle_type` varchar(100),
	`started_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	`improvements` json,
	`score_before` decimal(5,2),
	`score_after` decimal(5,2),
	CONSTRAINT `integration_optimization_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_sync_config` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`sync_type` enum('full','incremental','webhook') NOT NULL DEFAULT 'incremental',
	`schedule` varchar(64),
	`last_sync_at` timestamp,
	`next_sync_at` timestamp,
	`retry_count` int DEFAULT 0,
	`max_retries` int DEFAULT 3,
	`backoff_minutes` int DEFAULT 5,
	`field_mapping_overrides` json,
	`filter_criteria` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_sync_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iul_crediting_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`effective_date` varchar(20) NOT NULL,
	`index_strategy` varchar(100) NOT NULL,
	`cap_rate` varchar(10),
	`participation_rate` varchar(10),
	`floor_rate` varchar(10),
	`spread` varchar(10),
	`multiplier_bonus` varchar(10),
	`source` varchar(30),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iul_crediting_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_access_transitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`from_grantee_id` int NOT NULL,
	`to_grantee_id` int NOT NULL,
	`topic` enum('insurance','investments','tax','estate','retirement','debt','budgeting','real_estate','business','education','health_finance','general','all') NOT NULL,
	`previous_access_level` varchar(32) NOT NULL,
	`new_access_level` varchar(32) NOT NULL,
	`reason` enum('client_switched','professional_left','org_change','manual','expired') NOT NULL,
	`transitioned_at` bigint NOT NULL,
	`transitioned_by` int NOT NULL,
	CONSTRAINT `kb_access_transitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_sharing_defaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationship_type` enum('financial_advisor','insurance_agent','tax_professional','estate_attorney','accountant','mortgage_broker','real_estate_agent','other') NOT NULL,
	`topic` enum('insurance','investments','tax','estate','retirement','debt','budgeting','real_estate','business','education','health_finance','general','all') NOT NULL,
	`default_access_level` enum('none','summary','read','contribute','full') NOT NULL DEFAULT 'read',
	`rationale` text,
	CONSTRAINT `kb_sharing_defaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_sharing_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`grantee_id` int NOT NULL,
	`grantee_type` enum('professional','manager','organization','admin') NOT NULL,
	`topic` enum('insurance','investments','tax','estate','retirement','debt','budgeting','real_estate','business','education','health_finance','general','all') NOT NULL,
	`access_level` enum('none','summary','read','contribute','full') NOT NULL DEFAULT 'read',
	`source` enum('default','user_set','professional_request','admin_override') NOT NULL DEFAULT 'default',
	`is_active` boolean NOT NULL DEFAULT true,
	`granted_at` bigint NOT NULL,
	`revoked_at` bigint,
	`expires_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `kb_sharing_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kg_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceNodeId` int NOT NULL,
	`targetNodeId` int NOT NULL,
	`edgeType` enum('owns','benefits_from','funds','pays','governs','depends_on','conflicts_with','beneficiary_of','manages','insures','employs','related_to') NOT NULL,
	`weight` float DEFAULT 1,
	`metadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kg_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kg_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nodeType` enum('person','account','goal','insurance','property','liability','income','tax','estate','product','regulation','document','advisor','beneficiary') NOT NULL,
	`label` varchar(256) NOT NULL,
	`dataJson` json,
	`status` enum('active','inactive','pending') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kg_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_article_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`user_id` int,
	`helpful` boolean NOT NULL,
	`feedback_text` text,
	`context` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_article_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_article_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`version` int NOT NULL,
	`content` text NOT NULL,
	`changed_by` int,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	`change_reason` text,
	CONSTRAINT `knowledge_article_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`content_type` enum('process','concept','reference','template','faq','policy','guide') NOT NULL DEFAULT 'concept',
	`metadata` json,
	`version` int NOT NULL DEFAULT 1,
	`effective_date` timestamp,
	`expiry_date` timestamp,
	`source` enum('manual','ingested','ai_generated','conversation_mining') NOT NULL DEFAULT 'manual',
	`source_url` text,
	`created_by` int,
	`approved_by` int,
	`approved_at` timestamp,
	`usage_count` int NOT NULL DEFAULT 0,
	`avg_helpfulness_score` float DEFAULT 0,
	`freshness_score` float DEFAULT 100,
	`last_used_at` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_gap_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gapId` varchar(128) NOT NULL,
	`gapTitle` varchar(512) NOT NULL,
	`gapCategory` varchar(128),
	`action` enum('dismiss','acknowledge','resolved','not_applicable') NOT NULL,
	`userNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_gap_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_gaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic_cluster` varchar(200) NOT NULL,
	`query_count` int NOT NULL DEFAULT 1,
	`sample_queries` json,
	`suggested_article_draft` text,
	`status` enum('open','in_progress','resolved','dismissed') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `knowledge_gaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_graph_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_entity_id` int NOT NULL,
	`to_entity_id` int NOT NULL,
	`relationship_type` varchar(128) NOT NULL,
	`weight` float DEFAULT 1,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`source` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_graph_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_graph_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity_type` enum('person','company','product','concept','regulation','account') NOT NULL,
	`canonical_name` varchar(512) NOT NULL,
	`aliases` json,
	`metadata` json,
	`last_verified` timestamp,
	`confidence` float DEFAULT 1,
	`source` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_graph_entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_ingestion_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_type` enum('document','url','conversation','api','template','bulk') NOT NULL,
	`source_url` text,
	`source_filename` varchar(500),
	`status_col` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`articles_created` int NOT NULL DEFAULT 0,
	`articles_updated` int NOT NULL DEFAULT 0,
	`started_at` timestamp,
	`completed_at` timestamp,
	`error` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_ingestion_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `layer_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`audit_type` enum('scheduled','manual','triggered','continuous') NOT NULL DEFAULT 'scheduled',
	`audit_direction` varchar(30) NOT NULL DEFAULT 'system_infrastructure',
	`target_id` int,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`findings` json,
	`overall_health_score` float,
	`metrics_snapshot` json,
	`ai_analysis` text,
	`recommendations` json,
	`run_by` int,
	`started_at` bigint,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `layer_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `layer_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`target_id` int,
	`metric_name` varchar(128) NOT NULL,
	`metric_value` float NOT NULL,
	`metric_unit` varchar(32),
	`context` json,
	`period` varchar(32),
	`recorded_at` bigint NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `layer_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_capture_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`calculator_type` varchar(100),
	`gate_type` enum('none','results_summary','personalized_analysis','save_and_compare','full_report_pdf','advisor_match') DEFAULT 'personalized_analysis',
	`gate_trigger_point` varchar(200),
	`required_fields` json,
	`value_proposition` text,
	`enabled` boolean DEFAULT true,
	`conversion_rate` decimal(5,4),
	CONSTRAINT `lead_capture_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_capture_config_calculator_type_unique` UNIQUE(`calculator_type`)
);
--> statement-breakpoint
CREATE TABLE `lead_pipeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int,
	`professionalId` int,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`email` varchar(255),
	`phone` varchar(50),
	`source` varchar(100),
	`status` enum('new','enriched','scored','qualified','contacted','meeting','proposal','converted','disqualified') DEFAULT 'new',
	`propensityScore` decimal(5,2),
	`primaryInterest` varchar(100),
	`estimatedIncome` decimal(15,2),
	`protectionScore` decimal(5,2),
	`notesJson` json,
	`crmExternalId` varchar(255),
	`created_at` bigint,
	`updated_at` bigint,
	`location_id` int,
	`enrichment_data` json,
	`segment_data` json,
	`company` varchar(200),
	`title` varchar(200),
	`linkedin_url` varchar(500),
	`city` varchar(100),
	`state` varchar(50),
	`zip` varchar(20),
	`target_segment` varchar(100),
	`propensity_tier` enum('hot','warm','cool','cold'),
	`assigned_advisor_id` int,
	`assigned_at` bigint,
	`is_control_group` boolean DEFAULT false,
	`email_consent_granted` boolean DEFAULT false,
	`unsubscribed` boolean DEFAULT false,
	`pii_deletion_requested` boolean DEFAULT false,
	`ghl_contact_id` varchar(200),
	`ghl_opportunity_id` varchar(200),
	`pipeline_stage` varchar(50),
	`tags` json,
	CONSTRAINT `lead_pipeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_profile_accumulator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier_type` enum('email_hash','session_id','user_id') NOT NULL,
	`identifier_value` varchar(200) NOT NULL,
	`data_point_name` varchar(100) NOT NULL,
	`data_point_value` text,
	`data_point_source` varchar(100),
	`confidence` decimal(3,2),
	`conflicted` boolean DEFAULT false,
	`superseded_by` int,
	`collected_at` timestamp DEFAULT (now()),
	CONSTRAINT `lead_profile_accumulator_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_source_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_source_id` int NOT NULL,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`leads_generated` int DEFAULT 0,
	`leads_qualified` int DEFAULT 0,
	`leads_converted` int DEFAULT 0,
	`revenue_attributed` decimal(12,2),
	`cost` decimal(12,2),
	`cpl` decimal(10,2),
	`roi` decimal(8,2),
	CONSTRAINT `lead_source_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_name` varchar(200) NOT NULL,
	`source_type` enum('organic','paid','referral','event','directory','partnership') NOT NULL,
	`segment` varchar(100),
	`provider` varchar(200),
	`cost_model` enum('free','per_lead','per_click','subscription','revenue_share') DEFAULT 'free',
	`avg_cost` decimal(10,2),
	`est_volume_monthly` int,
	`quality_score` decimal(3,2),
	`enabled` boolean DEFAULT false,
	CONSTRAINT `lead_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`achievement_key` varchar(128) NOT NULL,
	`unlocked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_ai_quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline` varchar(128),
	`topic` varchar(255),
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`question_type` enum('multiple_choice','free_response','cloze') DEFAULT 'multiple_choice',
	`prompt` text NOT NULL,
	`options` json,
	`correct_answer` text,
	`explanation` text,
	`usage_count` int NOT NULL DEFAULT 0,
	`quality_score` decimal(4,3) DEFAULT '0.5',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_ai_quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_type` varchar(64) NOT NULL,
	`content_id` varchar(255) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline_id` int,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`source_ref` text,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_ce_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`license_id` int NOT NULL,
	`credit_type` varchar(128),
	`credit_hours` decimal(5,2) DEFAULT '0',
	`completed_date` date,
	`provider_name` varchar(255),
	`course_title` varchar(512),
	`certificate_url` text,
	`verified` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_ce_credits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_challenge_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challenge_id` int NOT NULL,
	`user_id` int NOT NULL,
	`score` decimal(5,2) DEFAULT '0',
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_challenge_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`track_id` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`intro` text,
	`is_practice` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` int,
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_chapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_definition_id` int NOT NULL,
	`to_definition_id` int NOT NULL,
	`relationship` varchar(255),
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','archived') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_content_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_table` varchar(128) NOT NULL,
	`content_id` int NOT NULL,
	`action` enum('create','update','delete','restore','publish','archive') NOT NULL,
	`previous_data` json,
	`new_data` json,
	`changed_by` int,
	`change_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_content_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_content_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content_source` varchar(128) NOT NULL,
	`content_key` varchar(255) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`checksum` varchar(64),
	`last_updated` timestamp NOT NULL DEFAULT (now()),
	`update_source` varchar(128),
	`changelog` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_content_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline_id` int,
	`term` varchar(512) NOT NULL,
	`definition` text NOT NULL,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`source_ref` text,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_disciplines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(32),
	`icon` varchar(32),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_core` boolean NOT NULL DEFAULT true,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('active','draft','archived') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_disciplines_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_disciplines_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `learning_discovery_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`seed_query` text,
	`follow_ups` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_discovery_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_flashcards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`track_id` int,
	`chapter_id` int,
	`term` varchar(512) NOT NULL,
	`definition` text NOT NULL,
	`source_label` varchar(255),
	`created_by` int,
	`source` enum('manual','ai_generated','user_authored') NOT NULL DEFAULT 'manual',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_flashcards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_formulas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline_id` int,
	`name` varchar(255) NOT NULL,
	`formula` text NOT NULL,
	`variables` json,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`source_ref` text,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_formulas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_fs_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline_id` int,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`source_ref` text,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_fs_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_group_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`detail` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_group_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`target_date` timestamp,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `learning_group_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_group_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`license_type` varchar(128) NOT NULL,
	`license_state` varchar(64),
	`license_number` varchar(128),
	`issue_date` date,
	`expiration_date` date,
	`status` enum('active','expired','pending','suspended') NOT NULL DEFAULT 'active',
	`ce_credits_required` int DEFAULT 0,
	`ce_credits_completed` int DEFAULT 0,
	`ce_deadline` date,
	`last_verified` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_licenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_mastery_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_key` varchar(255) NOT NULL,
	`item_type` varchar(64) NOT NULL,
	`seen` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`confidence` int NOT NULL DEFAULT 0,
	`review_count` int NOT NULL DEFAULT 0,
	`last_reviewed` timestamp,
	`next_due` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_mastery_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_pending_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`permission` enum('view','edit') DEFAULT 'view',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_pending_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_playlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`content_type` varchar(64) NOT NULL,
	`content_id` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `learning_playlist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_playlist_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`shared_with_user_id` int NOT NULL,
	`permission` enum('view','edit') DEFAULT 'view',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_playlist_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`is_public` boolean NOT NULL DEFAULT false,
	`share_token` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_practice_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`track_id` int,
	`chapter_id` int,
	`prompt` text NOT NULL,
	`options` json,
	`correct_index` int,
	`explanation` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`tags` json,
	`created_by` int,
	`source` enum('manual','ai_generated','user_authored') NOT NULL DEFAULT 'manual',
	`status` enum('published','draft','review','retired') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_practice_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_quiz_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`shared_quiz_id` int,
	`title` varchar(255) NOT NULL,
	`time_limit_seconds` int,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_quiz_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_regulatory_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(128) NOT NULL,
	`category` varchar(128),
	`title` varchar(512) NOT NULL,
	`summary` text,
	`effective_date` date,
	`affected_licenses` json,
	`affected_content` json,
	`reg_status` enum('new','reviewed','applied','dismissed') NOT NULL DEFAULT 'new',
	`reviewed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_regulatory_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`setting_key` varchar(128) NOT NULL,
	`setting_value` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_shared_quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`question_ids` json,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_shared_quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_activity_date` varchar(10),
	`daily_goal_minutes` int NOT NULL DEFAULT 15,
	`nudge_enabled` boolean NOT NULL DEFAULT false,
	`nudge_time` varchar(5),
	`total_days_active` int NOT NULL DEFAULT 0,
	`feature_flag` enum('control','treatment') NOT NULL DEFAULT 'treatment',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `learning_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_ls_user` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `learning_study_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`invite_code` varchar(32) NOT NULL,
	`owner_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_study_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_study_groups_invite_code_unique` UNIQUE(`invite_code`)
);
--> statement-breakpoint
CREATE TABLE `learning_study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`discipline` varchar(128),
	`track_key` varchar(128),
	`duration_minutes` int NOT NULL DEFAULT 0,
	`items_studied` int NOT NULL DEFAULT 0,
	`items_mastered` int NOT NULL DEFAULT 0,
	`quiz_score` decimal(5,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_study_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_subsections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapter_id` int NOT NULL,
	`title` varchar(512),
	`level` int NOT NULL DEFAULT 2,
	`paragraphs` json,
	`tables` json,
	`is_question` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` int,
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_subsections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('securities','planning','insurance','custom') NOT NULL DEFAULT 'custom',
	`title` varchar(512),
	`subtitle` text,
	`description` text,
	`color` varchar(32),
	`emoji` varchar(8),
	`tagline` text,
	`exam_overview` json,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_tracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_tracks_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `load_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_date` timestamp NOT NULL DEFAULT (now()),
	`scenario` varchar(256) NOT NULL,
	`concurrent_users` int,
	`requests_per_second` float,
	`p95_latency_ms` int,
	`errors` int DEFAULT 0,
	`notes` text,
	CONSTRAINT `load_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `location_alert_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_db_id` int NOT NULL,
	`location_id` varchar(100) NOT NULL,
	`metric_name` varchar(64) NOT NULL,
	`warning_threshold` float NOT NULL,
	`critical_threshold` float NOT NULL,
	`enabled` boolean DEFAULT true,
	`last_notified_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `location_alert_thresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ltc_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_age` int,
	`retirement_age` int DEFAULT 65,
	`state` varchar(2),
	`zip_code` varchar(10),
	`health_status` enum('excellent','good','fair','poor') DEFAULT 'good',
	`gender` enum('male','female','other'),
	`marital_status` enum('single','married','divorced','widowed'),
	`annual_income` decimal(15,2),
	`total_assets` decimal(15,2),
	`ltc_insurance_has` boolean DEFAULT false,
	`ltc_insurance_daily_benefit` decimal(10,2),
	`ltc_insurance_benefit_period` int,
	`projected_annual_cost` decimal(15,2),
	`projected_duration_years` decimal(5,2),
	`probability_of_need` decimal(5,2),
	`funding_gap` decimal(15,2),
	`recommended_strategy` varchar(50),
	`analysis_json` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ltc_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_data_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(50) NOT NULL,
	`dataType` enum('price','fx_rate','interest_rate','index','economic_indicator','commodity') NOT NULL,
	`value` decimal(18,6) NOT NULL,
	`currency` varchar(10) DEFAULT 'USD',
	`source` varchar(100),
	`observedAt` bigint NOT NULL,
	`metadataJson` json,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `market_data_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_data_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`subscribed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`magnitude` float,
	`details` text,
	`insight_generated` boolean DEFAULT false,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_index_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`index_symbol` varchar(20) NOT NULL,
	`date` varchar(20) NOT NULL,
	`open_price` varchar(20),
	`close_price` varchar(20),
	`daily_return` varchar(20),
	`total_return_index` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_index_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meddpicc_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`metrics` int DEFAULT 0,
	`economic_buyer` int DEFAULT 0,
	`decision_criteria` int DEFAULT 0,
	`decision_process` int DEFAULT 0,
	`paper_process` int DEFAULT 0,
	`identify_pain` int DEFAULT 0,
	`champion` int DEFAULT 0,
	`competition` int DEFAULT 0,
	`composite_score` decimal(5,2),
	`tier` varchar(20),
	`notes_json` json,
	`last_scored_at` bigint NOT NULL,
	`scored_by` varchar(100),
	CONSTRAINT `meddpicc_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicare_parameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parameter_year` int NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`value_json` json NOT NULL,
	`source_url` varchar(500),
	`effective_date` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicare_parameters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_action_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`assignedTo` varchar(256),
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_action_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int,
	`clientName` varchar(256),
	`clientId` int,
	`meetingType` enum('initial_consultation','portfolio_review','financial_plan','tax_planning','estate_planning','insurance_review','general','follow_up') DEFAULT 'general',
	`status` enum('scheduled','preparing','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`preMeetingBrief` text,
	`postMeetingSummary` text,
	`transcript` text,
	`keyDecisions` text,
	`followUpDate` timestamp,
	`followUpEmail` text,
	`complianceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('fact','preference','goal','relationship','financial','temporal') NOT NULL DEFAULT 'fact',
	`content` text NOT NULL,
	`source` varchar(128),
	`confidence` float DEFAULT 0.8,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`summary` text NOT NULL,
	`keyTopics` json,
	`emotionalTone` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memory_episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`confidenceScore` float,
	`complianceStatus` enum('pending','approved','flagged','rejected'),
	`modelVersion` varchar(64),
	`parentMessageId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mfa_backup_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mfa_backup_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mfa_secrets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`method` enum('totp','sms','email') NOT NULL DEFAULT 'totp',
	`verified` boolean NOT NULL DEFAULT false,
	`enabled` boolean NOT NULL DEFAULT false,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mfa_secrets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_backtests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`model_type` varchar(64) NOT NULL,
	`historical_event` varchar(128) NOT NULL,
	`event_year` int NOT NULL,
	`portfolio_params` json,
	`result_json` json,
	`max_drawdown` float,
	`recovery_months` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_backtests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_name` varchar(255) NOT NULL,
	`version` varchar(50) NOT NULL DEFAULT '1.0',
	`description` text,
	`intended_use` text,
	`limitations` text,
	`training_data_summary` text,
	`performance_metrics` json,
	`fairness_metrics` json,
	`ethical_considerations` text,
	`update_frequency` varchar(100),
	`last_evaluated_at` timestamp,
	`published` boolean NOT NULL DEFAULT false,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_output_records` (
	`id` varchar(36) NOT NULL,
	`run_id` varchar(36) NOT NULL,
	`model_id` varchar(36) NOT NULL,
	`entity_type` enum('user','organization','team','platform') DEFAULT 'user',
	`entity_id` int,
	`output_type` varchar(64) NOT NULL,
	`output_value` json,
	`confidence` float,
	`previous_value` json,
	`delta` json,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_output_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_runs` (
	`id` varchar(36) NOT NULL,
	`model_id` varchar(36) NOT NULL,
	`triggered_by` enum('schedule','event','manual','dependency') NOT NULL,
	`trigger_source` varchar(128),
	`input_data` json,
	`output_data` json,
	`status` enum('pending','running','completed','failed','cancelled') DEFAULT 'pending',
	`error_message` text,
	`duration_ms` int,
	`affected_user_ids` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `model_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`base_run_id` int,
	`model_type` varchar(64) NOT NULL,
	`scenario_name` varchar(256) NOT NULL,
	`adjusted_params` json,
	`result_json` json,
	`comparison_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_schedules` (
	`id` varchar(36) NOT NULL,
	`model_id` varchar(36) NOT NULL,
	`cron_expression` varchar(64) NOT NULL,
	`timezone` varchar(64) DEFAULT 'UTC',
	`is_active` boolean DEFAULT true,
	`last_run_at` timestamp,
	`next_run_at` timestamp,
	`filter_criteria` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nitrogen_risk_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nitrogen_risk_number` int,
	`portfolio_risk_number` int,
	`risk_alignment_score` int,
	`last_synced_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nitrogen_risk_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`channel` enum('in_app','email','push','sms') DEFAULT 'in_app',
	`urgency` enum('low','medium','high','critical') DEFAULT 'medium',
	`title` varchar(256),
	`content` text,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`suppressed` boolean DEFAULT false,
	`suppressionReason` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `office_hour_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`office_hour_id` int NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('registered','attended','no_show','cancelled') NOT NULL DEFAULT 'registered',
	`registered_at` timestamp DEFAULT (now()),
	CONSTRAINT `office_hour_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_ohr_unique` UNIQUE(`office_hour_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `office_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`host_user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`track_id` int,
	`scheduled_at` timestamp NOT NULL,
	`duration_minutes` int NOT NULL DEFAULT 60,
	`max_attendees` int NOT NULL DEFAULT 20,
	`current_attendees` int NOT NULL DEFAULT 0,
	`status` enum('scheduled','live','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`meeting_url` varchar(512),
	`recording_url` varchar(512),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `office_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`path` enum('advisor','client','admin') NOT NULL,
	`current_step` int DEFAULT 0,
	`total_steps` int DEFAULT 5,
	`completed_steps` json,
	`skipped_basics` boolean DEFAULT false,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_ai_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`preferred_model` varchar(128),
	`monthly_token_budget` int,
	`tokens_used_this_month` int DEFAULT 0,
	`custom_system_prompt_additions` text,
	`budget_alert_sent` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_ai_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_prompt_customizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`prompt_text` text NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewed_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_prompt_customizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_retention_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`data_category` varchar(128) NOT NULL,
	`retention_days` int NOT NULL,
	`action` enum('delete','archive','anonymize') DEFAULT 'archive',
	`configured_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_retention_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_landing_page_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`headline` varchar(512) DEFAULT 'Your Complete Financial Picture, Understood by Us',
	`subtitle` text,
	`ctaText` varchar(128) DEFAULT 'Start Your Financial Twin →',
	`secondaryLinkText` varchar(128) DEFAULT 'Try it anonymously',
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#0F172A',
	`accentColor` varchar(7) DEFAULT '#0EA5E9',
	`backgroundOption` varchar(64) DEFAULT 'gradient',
	`secondaryColor` varchar(7) DEFAULT '#1E293B',
	`fontFamily` varchar(128) DEFAULT 'Inter',
	`heroImageUrl` text,
	`customCss` text,
	`backgroundPattern` varchar(64) DEFAULT 'mesh',
	`faviconUrl` text,
	`trustSignal1` text,
	`trustSignal2` text,
	`trustSignal3` text,
	`disclaimerText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_landing_page_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_landing_page_config_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `organization_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentOrgId` int NOT NULL,
	`childOrgId` int NOT NULL,
	`relationshipType` enum('partner','subsidiary','affiliate','referral','vendor','client') NOT NULL,
	`status` enum('active','inactive','pending') DEFAULT 'active',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`trade_type` enum('buy','sell') NOT NULL,
	`quantity` decimal(18,6) NOT NULL,
	`price` decimal(18,6) NOT NULL,
	`total_value` decimal(18,2) NOT NULL,
	`ai_suggested` boolean NOT NULL DEFAULT false,
	`ai_reasoning` text,
	`actual_price_at_close` decimal(18,6),
	`pnl` decimal(18,2),
	`pnl_percent` float,
	`status` enum('open','closed','cancelled') NOT NULL DEFAULT 'open',
	`opened_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paper_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passive_action_log` (
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
--> statement-breakpoint
CREATE TABLE `passive_action_preferences` (
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
--> statement-breakpoint
CREATE TABLE `pattern_transition_assessments` (
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
--> statement-breakpoint
CREATE TABLE `peer_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` varchar(30) NOT NULL DEFAULT 'member',
	`status` varchar(30) NOT NULL DEFAULT 'active',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peer_group_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_pgm_unique` UNIQUE(`group_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `peer_group_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peer_group_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `peer_groups` (
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
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
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
--> statement-breakpoint
CREATE TABLE `permission_audit_log` (
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
--> statement-breakpoint
CREATE TABLE `personal_financial_reviews` (
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
--> statement-breakpoint
CREATE TABLE `pfm_imports` (
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
--> statement-breakpoint
CREATE TABLE `pfr_documents` (
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
--> statement-breakpoint
CREATE TABLE `plaid_holdings` (
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
--> statement-breakpoint
CREATE TABLE `plaid_webhook_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_id` varchar(100),
	`webhook_type` varchar(50) NOT NULL,
	`webhook_code` varchar(50) NOT NULL,
	`error_code` varchar(50),
	`processed_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_webhook_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plaid_webhooks_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_type` varchar(128) NOT NULL,
	`item_id` varchar(256),
	`payload` json,
	`processed_at` timestamp,
	`status` enum('received','processing','processed','failed') DEFAULT 'received',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plaid_webhooks_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_actual_insights` (
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
--> statement-breakpoint
CREATE TABLE `plan_adherence` (
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
--> statement-breakpoint
CREATE TABLE `planning_assumptions` (
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
--> statement-breakpoint
CREATE TABLE `planning_nodes` (
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
--> statement-breakpoint
CREATE TABLE `planning_references` (
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
--> statement-breakpoint
CREATE TABLE `planning_snapshots` (
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
--> statement-breakpoint
CREATE TABLE `platform_changelog` (
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
--> statement-breakpoint
CREATE TABLE `platform_kv` (
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `platform_kv_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `platform_learnings` (
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
--> statement-breakpoint
CREATE TABLE `policy_deliveries` (
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
--> statement-breakpoint
CREATE TABLE `portal_engagement` (
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
--> statement-breakpoint
CREATE TABLE `practice_metrics` (
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
--> statement-breakpoint
CREATE TABLE `predictive_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger_type` varchar(128) NOT NULL,
	`condition_json` json,
	`action_type` varchar(64) NOT NULL,
	`action_json` json,
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictive_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_finance_cases` (
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
--> statement-breakpoint
CREATE TABLE `privacy_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiCallPurpose` varchar(128) NOT NULL,
	`dataCategories` json,
	`piiMasked` boolean DEFAULT false,
	`modelUsed` varchar(64),
	`tokensSent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacy_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_consent_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`consent_type` varchar(50),
	`granted` boolean DEFAULT false,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `privacy_consent_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proactive_escalation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger_type` varchar(128) NOT NULL,
	`condition_text` text,
	`threshold` float,
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proactive_escalation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proactive_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int,
	`client_id` int,
	`category` enum('compliance','portfolio','tax','engagement','spending','life_event') NOT NULL DEFAULT 'portfolio',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(256) NOT NULL,
	`description` text,
	`suggested_action` text,
	`status` enum('new','viewed','acted','dismissed','snoozed') NOT NULL DEFAULT 'new',
	`snooze_until` timestamp,
	`acted_at` timestamp,
	`dismissed_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proactive_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `probe_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(200) NOT NULL,
	`probe_timestamp` timestamp NOT NULL DEFAULT (now()),
	`batches_completed` int DEFAULT 0,
	`first_throttle_batch` int,
	`discovered_rpm` int,
	`confidence` decimal(3,2),
	`raw_log` json,
	`approved_by` int,
	`applied` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `probe_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_suitability_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`user_id` int NOT NULL,
	`suitability_score` float,
	`evaluation_date` timestamp NOT NULL DEFAULT (now()),
	`qualifying_dimensions` json,
	`disqualifying_dimensions` json,
	`status` enum('qualified','marginal','disqualified','needs_review') DEFAULT 'qualified',
	CONSTRAINT `product_suitability_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_actuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`period_type` enum('daily','weekly','monthly','quarterly','annual') NOT NULL,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`gdc_actual` decimal(12,2),
	`cases_placed` int,
	`cases_submitted` int,
	`premium_volume` decimal(14,2),
	`product_breakdown` json,
	`funnel_actuals` json,
	`channel_actuals` json,
	`aum_added` decimal(14,2),
	`team_recruited` int,
	`data_source` enum('manual','ghl_sync','carrier_import','calculated') DEFAULT 'manual',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `production_actuals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`company` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`category` enum('iul','term_life','disability','ltc','premium_finance','whole_life','variable_life') NOT NULL,
	`description` text,
	`features` json,
	`riskLevel` enum('low','moderate','moderate_high','high'),
	`minPremium` float,
	`maxPremium` float,
	`targetAudience` text,
	`competitorFlag` boolean DEFAULT false,
	`isPlatform` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` varchar(8) NOT NULL,
	`end_time` varchar(8) NOT NULL,
	`timezone` varchar(64) DEFAULT 'America/New_York',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professional_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_context` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`addedBy` int NOT NULL,
	`rawInput` text NOT NULL,
	`parsedDomains` json,
	`visibleToClient` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professional_context_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`document_type` varchar(100),
	`file_url` varchar(500),
	`uploaded_at` timestamp DEFAULT (now()),
	`verified` boolean DEFAULT false,
	CONSTRAINT `professional_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`professional_id` int NOT NULL,
	`relationship_type` enum('financial_advisor','insurance_agent','tax_professional','estate_attorney','accountant','mortgage_broker','real_estate_agent','other') NOT NULL,
	`status` enum('active','inactive','pending','ended') NOT NULL DEFAULT 'active',
	`started_at` bigint,
	`ended_at` bigint,
	`notes` text,
	`last_contact_at` bigint,
	`referral_source` varchar(128),
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `professional_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professional_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(256),
	`review` text,
	`is_anonymous` boolean DEFAULT false,
	`status` enum('published','pending','flagged','removed') NOT NULL DEFAULT 'pending',
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `professional_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linked_user_id` int,
	`name` varchar(256) NOT NULL,
	`title` varchar(256),
	`firm` varchar(256),
	`email` varchar(320),
	`phone` varchar(32),
	`website` varchar(512),
	`location` varchar(256),
	`state` varchar(64),
	`bio` text,
	`avatar_url` text,
	`credentials` json,
	`licenses` json,
	`specializations` json,
	`tier` enum('tier1_existing','tier2_org_affiliated','tier3_specialty','tier4_location','tier5_general') NOT NULL DEFAULT 'tier5_general',
	`verified` boolean NOT NULL DEFAULT false,
	`verified_at` bigint,
	`source` enum('manual','directory_import','org_roster','self_registered','referral') NOT NULL DEFAULT 'manual',
	`avg_rating` float DEFAULT 0,
	`review_count` int DEFAULT 0,
	`years_experience` int,
	`aum_range` varchar(64),
	`fee_structure` varchar(128),
	`minimum_investment` varchar(64),
	`services_offered` json,
	`languages_spoken` json,
	`status` enum('active','inactive','pending_verification','suspended') NOT NULL DEFAULT 'active',
	`created_by` int,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_experiment_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experiment_name` varchar(256) NOT NULL,
	`variant_a_id` int NOT NULL,
	`variant_b_id` int NOT NULL,
	`total_samples` int DEFAULT 0,
	`variant_a_positive` int DEFAULT 0,
	`variant_b_positive` int DEFAULT 0,
	`variant_a_avg_latency` float,
	`variant_b_avg_latency` float,
	`p_value` float,
	`significance_reached` boolean DEFAULT false,
	`winner_id` int,
	`auto_promoted` boolean DEFAULT false,
	`status` enum('running','completed','cancelled') DEFAULT 'running',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `prompt_experiment_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variantId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int,
	`feedbackRating` enum('up','down'),
	`confidenceScore` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_golden_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prompt_text` text NOT NULL,
	`expected_response_pattern` text NOT NULL,
	`category` varchar(64) DEFAULT 'general',
	`compliance_must_pass` boolean DEFAULT true,
	`min_similarity_score` float DEFAULT 0.7,
	`is_active` boolean DEFAULT true,
	`last_tested_at` timestamp,
	`last_passed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_golden_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prompt_text` text NOT NULL,
	`prompt_category` varchar(100),
	`source` enum('suggested','typed','voice','command_palette') NOT NULL DEFAULT 'typed',
	`was_suggested` boolean NOT NULL DEFAULT false,
	`was_clicked` boolean NOT NULL DEFAULT false,
	`response_quality_score` float,
	`session_context` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_regression_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variant_id` int,
	`total_tests` int DEFAULT 0,
	`passed_tests` int DEFAULT 0,
	`avg_similarity` float,
	`compliance_pass_rate` float,
	`quality_drop` boolean DEFAULT false,
	`promotion_blocked` boolean DEFAULT false,
	`run_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_regression_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`promptTemplate` text NOT NULL,
	`category` varchar(64) DEFAULT 'system',
	`isActive` boolean DEFAULT true,
	`weight` float DEFAULT 1,
	`totalUses` int DEFAULT 0,
	`avgRating` float DEFAULT 0,
	`positiveCount` int DEFAULT 0,
	`negativeCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompt_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propagation_actions` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`actor_id` int NOT NULL,
	`action_type` enum('acknowledge','act','dismiss','escalate','snooze','delegate') NOT NULL,
	`notes` text,
	`result_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propagation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propagation_events` (
	`id` varchar(36) NOT NULL,
	`source_layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`target_layer` enum('platform','organization','manager','professional','user') NOT NULL,
	`event_type` enum('insight','alert','recommendation','compliance','milestone','risk_change','opportunity') NOT NULL,
	`source_entity_id` int,
	`target_entity_id` int,
	`payload` json,
	`priority` enum('critical','high','medium','low') DEFAULT 'medium',
	`status` enum('pending','delivered','acknowledged','acted','dismissed','expired') DEFAULT 'pending',
	`delivered_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propagation_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propensity_bias_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_id` int NOT NULL,
	`audit_type` varchar(100),
	`protected_class` varchar(100),
	`disparity_ratio` decimal(5,3),
	`passes` boolean,
	`details` json,
	`audited_at` timestamp DEFAULT (now()),
	CONSTRAINT `propensity_bias_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propensity_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feature_name` varchar(200) NOT NULL,
	`feature_source` varchar(100),
	`data_type` enum('numeric','categorical','boolean') NOT NULL,
	`description` text,
	`importance_rank` int,
	CONSTRAINT `propensity_features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propensity_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_name` varchar(200) NOT NULL,
	`model_type` enum('expert_weights','logistic','gradient_boosting') DEFAULT 'expert_weights',
	`target_segment` varchar(100),
	`version` int DEFAULT 1,
	`features` json,
	`weights` json,
	`performance_metrics` json,
	`active` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `propensity_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propensity_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int NOT NULL,
	`model_id` int NOT NULL,
	`score` decimal(5,4) NOT NULL,
	`features_used` json,
	`scored_at` timestamp DEFAULT (now()),
	CONSTRAINT `propensity_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_name` varchar(100) NOT NULL,
	`check_type` enum('known_good_query','availability_check','response_validation') NOT NULL,
	`known_good_input` json,
	`expected_result_pattern` varchar(500),
	`status` enum('healthy','degraded','down','blocked') DEFAULT 'healthy',
	`response_time_ms` int,
	`last_checked_at` timestamp,
	`last_healthy_at` timestamp,
	`consecutive_failures` int DEFAULT 0,
	`alert_sent` boolean DEFAULT false,
	CONSTRAINT `provider_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`score` float NOT NULL,
	`reasoning` text,
	`improvementSuggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(100) NOT NULL,
	`domain` varchar(200) NOT NULL,
	`current_rpm` int NOT NULL DEFAULT 10,
	`discovered_limit` int,
	`static_maximum` int NOT NULL DEFAULT 60,
	`safety_factor` decimal(3,2) DEFAULT '0.70',
	`daily_budget` int DEFAULT 1000,
	`daily_used` int DEFAULT 0,
	`daily_reset_at` timestamp,
	`success_rate` decimal(5,2) DEFAULT '100.00',
	`avg_latency_ms` int,
	`last_throttled_at` timestamp,
	`last_blocked_at` timestamp,
	`is_government` boolean DEFAULT false,
	`probe_enabled` boolean DEFAULT false,
	`enabled` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rate_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_profiles_provider_unique` UNIQUE(`provider`)
);
--> statement-breakpoint
CREATE TABLE `rate_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(50) NOT NULL,
	`recommendation_type` varchar(50) NOT NULL,
	`recommendation_json` json NOT NULL,
	`confidence` decimal(3,2),
	`status` enum('pending_review','auto_applicable','approved','rejected','applied') DEFAULT 'pending_review',
	`reviewed_by` int,
	`applied_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rate_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_signal_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(100) NOT NULL,
	`signal_type` enum('rate_limit_header','retry_after','http_429','http_403','latency_spike','connection_reset','timeout','captcha_detected','soft_block','rate_reduction') NOT NULL,
	`signal_data` json,
	`http_status` int,
	`retry_after_seconds` int,
	`rate_headers` json,
	`previous_rpm` int,
	`adjusted_rpm` int,
	`auto_applied` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rate_signal_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reasoning_traces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int,
	`step_number` int NOT NULL,
	`thought` text,
	`action` text,
	`observation` text,
	`tool_name` varchar(100),
	`duration_ms` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reasoning_traces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`advisor_id` int,
	`conversation_id` int,
	`message_id` int,
	`product_id` int,
	`recommendation_type` enum('product','strategy','action','allocation','rebalance') NOT NULL,
	`summary` text NOT NULL,
	`reasoning` text,
	`factors` json,
	`confidence_score` float,
	`suitability_score` float,
	`risk_level` enum('low','medium','high','very_high'),
	`disclaimers` json,
	`coi_disclosure_ids` json,
	`status` enum('suggested','accepted','rejected','implemented','expired') NOT NULL DEFAULT 'suggested',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_id` varchar(256) NOT NULL,
	`expected_balance` decimal(18,2),
	`actual_balance` decimal(18,2),
	`discrepancy` decimal(18,2),
	`resolved` boolean DEFAULT false,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reconciliation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruit_dimension_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_id` int NOT NULL,
	`production_fit` int DEFAULT 0,
	`cultural_fit` int DEFAULT 0,
	`geographic_fit` int DEFAULT 0,
	`network_leverage` int DEFAULT 0,
	`compliance_posture` int DEFAULT 0,
	`engagement_signal` int DEFAULT 0,
	`composite_score` int DEFAULT 0,
	`tier` varchar(20),
	`cascade_potential_count` int DEFAULT 0,
	`cascade_rationale` text,
	`priority_actions_json` json,
	`full_result_json` json,
	`scored_at` bigint NOT NULL,
	CONSTRAINT `recruit_dimension_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_type` enum('client','professional','coi_contact') NOT NULL,
	`referrer_id` int NOT NULL,
	`referred_email` varchar(200),
	`referred_name` varchar(200),
	`referral_channel` enum('tool_share','event_invite','direct_referral','widget_lead','content_share') DEFAULT 'direct_referral',
	`referral_status` enum('sent','clicked','registered','qualified','converted') DEFAULT 'sent',
	`compliance_disclosed` boolean DEFAULT false,
	`monetary_compensation` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`converted_at` timestamp,
	CONSTRAINT `referral_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromProfessionalId` int NOT NULL,
	`toCoiId` int NOT NULL,
	`clientId` int,
	`reason` text,
	`outcome` enum('pending','accepted','completed','declined') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(128) NOT NULL,
	`filing_type` varchar(64),
	`entity` varchar(256),
	`relevance_to_user` text,
	`summary` text,
	`alert_sent` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_impact_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`update_id` int NOT NULL,
	`impact_level` enum('high','medium','low') DEFAULT 'low',
	`affected_areas` json,
	`recommended_actions` json,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_impact_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(128) NOT NULL,
	`title` varchar(512) NOT NULL,
	`summary` text,
	`relevance_score` float,
	`categories` json,
	`action_required` boolean DEFAULT false,
	`reviewed_by` int,
	`published_at` timestamp,
	`ingested_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`org_id` int,
	`template_id` int NOT NULL,
	`client_id` int,
	`parameters` json,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`output_url` text,
	`output_key` text,
	`output_format` enum('pdf','docx','html') NOT NULL DEFAULT 'pdf',
	`error_message` text,
	`scheduled_at` timestamp,
	`recurring_cron` varchar(100),
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_type` enum('individual_performance','team_performance','regional_comparison','campaign_roi','client_outcomes','industry_benchmark','pipeline_health','recruiting_tracker') NOT NULL,
	`scope_type` enum('platform','region','team','individual') NOT NULL,
	`scope_id` int,
	`period_start` date,
	`period_end` date,
	`report_data` json,
	`generated_at` timestamp DEFAULT (now()),
	CONSTRAINT `report_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('portfolio_review','financial_plan','insurance_analysis','tax_summary','estate_plan','quarterly_report','annual_review','custom') NOT NULL DEFAULT 'custom',
	`template_body` text NOT NULL,
	`sections` json,
	`branding` json,
	`is_system` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`message_id` int,
	`response_type` enum('chat','insight','brief','plan','consensus'),
	`rating_value` enum('thumbs_up','thumbs_down'),
	`feedback_text` text,
	`model` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `response_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retention_actions_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data_type` varchar(128) NOT NULL,
	`action` enum('delete','archive','anonymize') NOT NULL,
	`records_affected` int DEFAULT 0,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retention_actions_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int NOT NULL,
	`confidenceScore` float NOT NULL,
	`autonomyLevel` enum('high','medium','low') NOT NULL,
	`aiReasoning` text,
	`aiRecommendation` text,
	`complianceNotes` text,
	`status` enum('pending','approved','rejected','modified') NOT NULL DEFAULT 'pending',
	`reviewerAction` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rich_media_embeds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int,
	`media_type` enum('video','audio','image','document','shopping','chart','link_preview') NOT NULL,
	`source` varchar(500) NOT NULL,
	`title` varchar(300),
	`thumbnail_url` varchar(500),
	`start_time` int,
	`end_time` int,
	`metadata` json,
	`relevance_score` decimal(3,2),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `rich_media_embeds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_elevations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`from_role` varchar(32) NOT NULL,
	`to_role` varchar(32) NOT NULL,
	`granted_by` int NOT NULL,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`reason` text,
	`revoked_at` timestamp,
	CONSTRAINT `role_elevations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`client_id` int,
	`analysis_type` enum('tax_projection','ss_optimization','hsa_optimization','medicare_navigation','charitable_giving','divorce_financial','education_plan','fee_comparison') NOT NULL,
	`title` varchar(256),
	`input_json` text,
	`result_json` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrape_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data_source_id` int NOT NULL,
	`cron_expression` varchar(100) NOT NULL,
	`next_run_at` bigint,
	`last_run_at` bigint,
	`enabled` boolean DEFAULT true,
	`retry_on_failure` boolean DEFAULT true,
	`max_retries` int DEFAULT 3,
	`notify_on_failure` boolean DEFAULT true,
	`created_at` bigint NOT NULL,
	CONSTRAINT `scrape_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraping_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(100) NOT NULL,
	`domain` varchar(200) NOT NULL,
	`endpoint` varchar(500),
	`method` enum('GET','POST','PUT','DELETE','PATCH') DEFAULT 'GET',
	`status_code` int,
	`response_time_ms` int,
	`rate_limit_remaining` int,
	`rate_limit_reset` timestamp,
	`user_agent` varchar(500),
	`robots_txt_checked` boolean DEFAULT false,
	`robots_txt_allowed` boolean DEFAULT true,
	`cache_hit` boolean DEFAULT false,
	`error_message` text,
	`request_hash` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scraping_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraping_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cache_key` varchar(256) NOT NULL,
	`provider` varchar(100) NOT NULL,
	`endpoint` varchar(500),
	`response_body` text,
	`response_headers` json,
	`status_code` int,
	`ttl_seconds` int DEFAULT 86400,
	`hit_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `scraping_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `scraping_cache_cache_key_unique` UNIQUE(`cache_key`)
);
--> statement-breakpoint
CREATE TABLE `search_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query_hash` varchar(64) NOT NULL,
	`query_text` text NOT NULL,
	`category` varchar(50),
	`result_json` json,
	`source_citations` json,
	`hit_count` int DEFAULT 1,
	`expires_at` bigint NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `search_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_discovery_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`conversation_id` int NOT NULL,
	`trigger_message_id` int,
	`last_user_query` text,
	`last_ai_response` text,
	`generated_query` text NOT NULL,
	`direction` enum('deeper','broader','applied') NOT NULL,
	`layer_context` varchar(32),
	`proficiency_level` varchar(32),
	`feature_context` json,
	`status` enum('generated','sent','dismissed','completed') DEFAULT 'generated',
	`user_engaged` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `self_discovery_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_errors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`error_type` varchar(128) NOT NULL,
	`message` text,
	`stack` text,
	`component_name` varchar(256),
	`user_id` int,
	`url` varchar(1024),
	`metadata` json,
	`resolved` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`scope` enum('platform','team','advisor','client') NOT NULL DEFAULT 'advisor',
	`scope_entity_id` int,
	`assumption_key` varchar(255) NOT NULL,
	`assumption_value` decimal(14,4) NOT NULL,
	`assumption_label` varchar(500),
	`source` varchar(500),
	`effective_date` date,
	`expiry_date` date,
	`is_locked` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_assumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`shared_content_type` enum('protection_score','plan_summary','calculator_result','chat_excerpt') NOT NULL,
	`content_id` int NOT NULL,
	`share_token` varchar(64) NOT NULL,
	`expires_at` timestamp,
	`view_count` int DEFAULT 0,
	`max_views` int DEFAULT 100,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `shared_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_links_share_token_unique` UNIQUE(`share_token`)
);
--> statement-breakpoint
CREATE TABLE `smsit_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sync_direction` enum('inbound','outbound') NOT NULL,
	`smsit_contact_id` varchar(200),
	`lead_pipeline_id` int,
	`sync_type` enum('create','update','delete','opt_out') NOT NULL,
	`fields_synced` json,
	`smsit_status` enum('success','failed','skipped') DEFAULT 'success',
	`error_message` text,
	`synced_at` timestamp DEFAULT (now()),
	CONSTRAINT `smsit_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`servicer` varchar(256),
	`balance` float NOT NULL,
	`rate` float NOT NULL,
	`loanType` enum('subsidized','unsubsidized','plus','grad_plus','private','consolidation') NOT NULL,
	`repaymentPlan` varchar(64),
	`paymentsMade` int DEFAULT 0,
	`remainingTerm` int,
	`pslfQualifyingPayments` int DEFAULT 0,
	`pslfEligible` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`certification` varchar(100) NOT NULL,
	`topics_covered` json,
	`quiz_scores` json,
	`weak_areas` json,
	`study_time_minutes` int NOT NULL DEFAULT 0,
	`total_questions_attempted` int NOT NULL DEFAULT 0,
	`total_questions_correct` int NOT NULL DEFAULT 0,
	`current_difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
	`last_session_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`riskTolerance` enum('conservative','moderate','aggressive'),
	`investmentHorizon` varchar(64),
	`annualIncome` varchar(64),
	`netWorth` varchar(64),
	`investmentExperience` enum('none','limited','moderate','extensive'),
	`financialGoals` json,
	`insuranceNeeds` json,
	`responses` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suitability_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_change_events` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(36) NOT NULL,
	`dimension_key` varchar(64),
	`change_type` enum('user_input','advisor_update','system_inference','integration_sync','decay','milestone') NOT NULL,
	`previous_value` json,
	`new_value` json,
	`source` varchar(128),
	`confidence` float,
	`triggered_by` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suitability_change_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_dimensions` (
	`id` varchar(36) NOT NULL,
	`profile_id` varchar(36) NOT NULL,
	`dimension_key` varchar(64) NOT NULL,
	`dimension_label` varchar(128) NOT NULL,
	`value` json,
	`score` float,
	`confidence` float DEFAULT 0,
	`sources` json,
	`last_updated_at` timestamp NOT NULL DEFAULT (now()),
	`decay_rate` float DEFAULT 0.01,
	`next_review_at` timestamp,
	CONSTRAINT `suitability_dimensions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_household_links` (
	`id` varchar(36) NOT NULL,
	`primary_user_id` int NOT NULL,
	`linked_user_id` int NOT NULL,
	`relationship` enum('spouse','partner','dependent','parent','sibling','other') NOT NULL,
	`shared_dimensions` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suitability_household_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int,
	`overall_score` float,
	`confidence_level` float DEFAULT 0,
	`data_completeness` float DEFAULT 0,
	`last_synthesized_at` timestamp,
	`synthesis_version` int DEFAULT 1,
	`dimension_scores` json,
	`source_breakdown` json,
	`change_velocity` float,
	`status` enum('draft','active','needs_review','archived') DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suitability_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suitability_questions_queue` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`dimension_key` varchar(64) NOT NULL,
	`question` text NOT NULL,
	`question_type` enum('multiple_choice','scale','free_text','yes_no','numeric') DEFAULT 'multiple_choice',
	`options` json,
	`priority` int DEFAULT 50,
	`status` enum('pending','asked','answered','skipped','expired') DEFAULT 'pending',
	`asked_at` timestamp,
	`answered_at` timestamp,
	`answer` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suitability_questions_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_event_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_id` varchar(128) NOT NULL,
	`location_id` varchar(100),
	`location_db_id` int,
	`channel` varchar(20) NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`contact_external_id` varchar(128),
	`detected_at` bigint NOT NULL,
	`ghl_timestamp` bigint,
	`latency_ms` bigint,
	`payload_size` int DEFAULT 0,
	`success` boolean DEFAULT true,
	`error_message` text,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sync_event_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_run_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`run_type` varchar(64) NOT NULL,
	`status` varchar(32) NOT NULL,
	`ghl_total` int DEFAULT 0,
	`stewardly_total` int DEFAULT 0,
	`matched` int DEFAULT 0,
	`created_in_stewardly` int DEFAULT 0,
	`created_in_ghl` int DEFAULT 0,
	`updated_in_stewardly` int DEFAULT 0,
	`updated_in_ghl` int DEFAULT 0,
	`conflicts_resolved` int DEFAULT 0,
	`orphans_fixed` int DEFAULT 0,
	`errors` int DEFAULT 0,
	`duration_ms` int DEFAULT 0,
	`resume_cursor` varchar(255),
	`complete` boolean DEFAULT false,
	`triggered_by` varchar(128),
	`started_at` bigint NOT NULL,
	`completed_at` bigint,
	CONSTRAINT `sync_run_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_health_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`health_event_type` enum('cron_success','cron_failure','cron_timeout','service_error','service_degraded','api_rate_exceeded','api_auth_failure','seed_data_stale','pii_access','compliance_flag') NOT NULL,
	`source_name` varchar(100),
	`health_severity` enum('info','warning','error','critical') NOT NULL,
	`message` text,
	`metadata` json,
	`acknowledged` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `system_health_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_return_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`taxYear` int NOT NULL,
	`filingStatus` enum('single','married_filing_jointly','married_filing_separately','head_of_household','qualifying_widow'),
	`adjustedGrossIncome` bigint,
	`taxableIncome` bigint,
	`totalTaxLiability` bigint,
	`effectiveTaxRate` varchar(20),
	`marginalBracket` varchar(20),
	`capitalGainsShortTerm` bigint,
	`capitalGainsLongTerm` bigint,
	`dividendIncome` bigint,
	`interestIncome` bigint,
	`businessIncome` bigint,
	`rentalIncome` bigint,
	`retirementDistributions` bigint,
	`charitableDeductions` bigint,
	`mortgageInterest` bigint,
	`saltDeductions` bigint,
	`itemizedVsStandard` enum('itemized','standard'),
	`findingsJson` json,
	`opportunitiesJson` json,
	`riskFlagsJson` json,
	`planningRecommendations` text,
	`documentUrl` text,
	`status` enum('pending_upload','uploaded','under_review','reviewed','action_items_created','completed') DEFAULT 'pending_upload',
	`reviewedAt` bigint,
	`planningNodeId` int,
	`goalId` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `tax_return_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_optimization_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int,
	`model` varchar(100),
	`domain` varchar(50),
	`avg_score` decimal(3,2),
	`sample_count` int,
	`tested_at` timestamp DEFAULT (now()),
	CONSTRAINT `template_optimization_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` varchar(256) NOT NULL,
	`user_id` int NOT NULL,
	`ai_category` varchar(128),
	`user_override_category` varchar(128),
	`confidence` float,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `underwriting_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`carrier` varchar(255),
	`product` varchar(255),
	`status` varchar(50) DEFAULT 'submitted',
	`requirements_json` json,
	`submitted_at` varchar(30),
	`last_status_update` varchar(30),
	`expected_decision_date` varchar(30),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `underwriting_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scope_type` enum('platform','organization','user') NOT NULL,
	`scope_id` int NOT NULL,
	`daily_query_limit` int DEFAULT 50,
	`monthly_query_limit` int DEFAULT 1000,
	`monthly_cost_ceiling` decimal(10,2) DEFAULT '10.00',
	`alert_threshold_pct` int DEFAULT 80,
	`current_period_cost` decimal(10,2) DEFAULT '0',
	`current_period_queries` int DEFAULT 0,
	`period_reset_at` timestamp,
	CONSTRAINT `usage_budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`operation_type` varchar(50),
	`model` varchar(100),
	`input_tokens` int,
	`output_tokens` int,
	`estimated_cost` decimal(8,6),
	`endpoint` varchar(200),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_ai_boundaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`boundary_type` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_ai_boundaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`owner_user_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`icon` varchar(256),
	`visibility_user_apps` enum('private','unlisted','public') NOT NULL DEFAULT 'private',
	`config` json,
	`install_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_apps_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_audio_overrides` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`audio_script_id` varchar(36) NOT NULL,
	`personalized_script` text NOT NULL,
	`personalized_ssml` text,
	`user_instruction` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_audio_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_audio_preferences` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`voice_id` varchar(100) DEFAULT 'en-US-GuyNeural',
	`speed` decimal(3,2) DEFAULT '1.00',
	`pitch` varchar(20) DEFAULT 'default',
	`expand_acronyms` boolean DEFAULT true,
	`simplify_language` boolean DEFAULT false,
	`include_examples` boolean DEFAULT true,
	`verbosity_level` varchar(20) DEFAULT 'standard',
	`enable_navigation_audio` boolean DEFAULT true,
	`enable_action_feedback` boolean DEFAULT true,
	`enable_sound_effects` boolean DEFAULT true,
	`auto_refine_scripts` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_audio_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_audio_prefs_user` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_autonomy_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`level` enum('supervised','guided','semi_autonomous','autonomous') NOT NULL DEFAULT 'supervised',
	`trust_score` float NOT NULL DEFAULT 0,
	`total_interactions` int NOT NULL DEFAULT 0,
	`successful_actions` int NOT NULL DEFAULT 0,
	`overridden_actions` int NOT NULL DEFAULT 0,
	`escalations` int NOT NULL DEFAULT 0,
	`last_escalation` timestamp,
	`level_history` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_autonomy_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_capabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`capability` varchar(100) NOT NULL,
	`granted` boolean DEFAULT false,
	`granted_by` int,
	`granted_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_capabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_changelog_awareness` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`changelog_id` int NOT NULL,
	`informed_via` enum('ai_chat','notification','changelog_page','onboarding') NOT NULL,
	`informed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_changelog_awareness_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_consents` (
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
--> statement-breakpoint
CREATE TABLE `user_feature_proficiency` (
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
--> statement-breakpoint
CREATE TABLE `user_guardrails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`guardrail_type` varchar(64) NOT NULL,
	`value` varchar(256) NOT NULL,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_guardrails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_insights_cache` (
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
--> statement-breakpoint
CREATE TABLE `user_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ghl_location_id` int NOT NULL,
	`access_level` enum('view','manage','admin') DEFAULT 'view',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_memories` (
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
--> statement-breakpoint
CREATE TABLE `user_platform_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`feature_key` varchar(128) NOT NULL,
	`metadata` json,
	`session_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_platform_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
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
--> statement-breakpoint
CREATE TABLE `user_relationships` (
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
--> statement-breakpoint
CREATE TABLE `video_streaming_sessions` (
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
--> statement-breakpoint
CREATE TABLE `view_as_audit_log` (
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
--> statement-breakpoint
CREATE TABLE `view_shares` (
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
--> statement-breakpoint
CREATE TABLE `wealth_hub_allocations` (
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
--> statement-breakpoint
CREATE TABLE `web_scrape_results` (
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
--> statement-breakpoint
CREATE TABLE `weight_presets` (
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
--> statement-breakpoint
CREATE TABLE `workflow_checklist` (
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
--> statement-breakpoint
CREATE TABLE `workflow_checkpoints` (
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
--> statement-breakpoint
CREATE TABLE `workflow_event_chains` (
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
--> statement-breakpoint
CREATE TABLE `workflow_execution_log` (
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
--> statement-breakpoint
CREATE TABLE `workflow_instances` (
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
--> statement-breakpoint
CREATE TABLE `zip_code_demographics` (
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
--> statement-breakpoint
CREATE INDEX `idx_ad_impression_ad` ON `ad_impression_log` (`ad_id`);--> statement-breakpoint
CREATE INDEX `idx_ad_impression_user` ON `ad_impression_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_advisory_executions_client_id` ON `advisory_executions` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_advisory_executions_professional_id` ON `advisory_executions` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_advisory_executions_gate_review_id` ON `advisory_executions` (`gateReviewId`);--> statement-breakpoint
CREATE INDEX `idx_advisory_executions_reviewer_id` ON `advisory_executions` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `idx_affiliated_resources_organization_id` ON `affiliated_resources` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_agent_actions_agent_instance_id` ON `agent_actions` (`agentInstanceId`);--> statement-breakpoint
CREATE INDEX `idx_agent_autonomy_levels_agent_template_id` ON `agent_autonomy_levels` (`agent_template_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_instances_user_id` ON `agent_instances` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_agent_instances_firm_id` ON `agent_instances` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_agent_performance_agent_template_id` ON `agent_performance` (`agent_template_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_templates_org_id` ON `agent_templates` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_response_quality_user_id` ON `ai_response_quality` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_response_quality_conversation_id` ON `ai_response_quality` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_response_quality_message_id` ON `ai_response_quality` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_calls_tool_id` ON `ai_tool_calls` (`tool_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_calls_conversation_id` ON `ai_tool_calls` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_calls_message_id` ON `ai_tool_calls` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_calls_user_id` ON `ai_tool_calls` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_executions_user_id` ON `ai_tool_executions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_executions_conversation_id` ON `ai_tool_executions` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_tool_executions_message_id` ON `ai_tool_executions` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_annual_reviews_client_id` ON `annual_reviews` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_annual_reviews_professional_id` ON `annual_reviews` (`professional_id`);--> statement-breakpoint
CREATE INDEX `app_installs_user_idx` ON `app_installs` (`user_id`);--> statement-breakpoint
CREATE INDEX `app_installs_app_idx` ON `app_installs` (`app_id`);--> statement-breakpoint
CREATE INDEX `app_share_links_app_idx` ON `app_share_links` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_as_user` ON `assessment_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_as_status` ON `assessment_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_as_user_status` ON `assessment_sessions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_audio_content` ON `audio_scripts` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `idx_asp_user_track` ON `audio_study_progress` (`user_id`,`track_slug`);--> statement-breakpoint
CREATE INDEX `idx_asp_completed` ON `audio_study_progress` (`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_asp_due_review` ON `audio_study_progress` (`user_id`,`next_review_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_trail_user_id` ON `audit_trail` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_trail_conversation_id` ON `audit_trail` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_audit_trail_message_id` ON `audit_trail` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_auth_enrichment_log_user_id` ON `auth_enrichment_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_provider_tokens_user_id` ON `auth_provider_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_benchmark_comparisons_client` ON `benchmark_comparisons` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_benchmark_comparisons_type` ON `benchmark_comparisons` (`comparisonType`);--> statement-breakpoint
CREATE INDEX `idx_benchmark_comparisons_snapshot` ON `benchmark_comparisons` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `idx_beneficiary_reviews_client` ON `beneficiary_reviews` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_beneficiary_reviews_advisor` ON `beneficiary_reviews` (`advisorId`);--> statement-breakpoint
CREATE INDEX `idx_beneficiary_reviews_status` ON `beneficiary_reviews` (`status`);--> statement-breakpoint
CREATE INDEX `idx_beneficiary_reviews_next_review` ON `beneficiary_reviews` (`nextReviewDate`);--> statement-breakpoint
CREATE INDEX `idx_billing_events_user_id` ON `billing_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_billing_events_stripe_event_id` ON `billing_events` (`stripe_event_id`);--> statement-breakpoint
CREATE INDEX `idx_billing_events_event_type` ON `billing_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_browser_sessions_user_id` ON `browser_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_browser_sessions_agent_run_id` ON `browser_sessions` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_browser_sessions_user_created_at` ON `browser_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_business_exit_plans_user_id` ON `business_exit_plans` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cca_user` ON `cadence_compliance_audit` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cca_type` ON `cadence_compliance_audit` (`audit_type`);--> statement-breakpoint
CREATE INDEX `idx_cca_grade` ON `cadence_compliance_audit` (`grade`);--> statement-breakpoint
CREATE INDEX `idx_ce_user_lead` ON `cadence_enrollments` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_ce_status` ON `cadence_enrollments` (`cadence_status`);--> statement-breakpoint
CREATE INDEX `idx_ce_next_touch` ON `cadence_enrollments` (`next_touch_due_at`);--> statement-breakpoint
CREATE INDEX `idx_cor_user_lead` ON `cadence_opt_out_registry` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_cor_opt_out_at` ON `cadence_opt_out_registry` (`opt_out_at`);--> statement-breakpoint
CREATE INDEX `idx_ctl_enrollment` ON `cadence_touch_log` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `idx_ctl_user_lead` ON `cadence_touch_log` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_ctl_status` ON `cadence_touch_log` (`touch_status`);--> statement-breakpoint
CREATE INDEX `idx_ctl_sent_at` ON `cadence_touch_log` (`sent_at`);--> statement-breakpoint
CREATE INDEX `idx_calc_cache_session` ON `calculator_result_cache` (`session_id`,`calculator_type`);--> statement-breakpoint
CREATE INDEX `idx_calc_cache_hash` ON `calculator_result_cache` (`inputs_hash`);--> statement-breakpoint
CREATE INDEX `idx_calculator_scenarios_user_id` ON `calculator_scenarios` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cr_user_item` ON `card_reviews` (`user_id`,`item_key`);--> statement-breakpoint
CREATE INDEX `idx_cr_user_date` ON `card_reviews` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE INDEX `idx_cr_flag` ON `card_reviews` (`feature_flag`);--> statement-breakpoint
CREATE INDEX `idx_cs_user_item` ON `card_schedules` (`user_id`,`item_key`,`item_type`);--> statement-breakpoint
CREATE INDEX `idx_cs_user_due` ON `card_schedules` (`user_id`,`next_due`);--> statement-breakpoint
CREATE INDEX `idx_cs_flag` ON `card_schedules` (`feature_flag`);--> statement-breakpoint
CREATE INDEX `idx_carrier_connections_firm_id` ON `carrier_connections` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_carrier_submissions_quote_id` ON `carrier_submissions` (`quote_id`);--> statement-breakpoint
CREATE INDEX `idx_carrier_submissions_carrier_id` ON `carrier_submissions` (`carrier_id`);--> statement-breakpoint
CREATE INDEX `idx_ce_credits_user` ON `ce_credits` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ce_credits_track` ON `ce_credits` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_ce_credits_status` ON `ce_credits` (`status`);--> statement-breakpoint
CREATE INDEX `idx_cp_chapter` ON `chapter_prerequisites` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `idx_cp_prereq` ON `chapter_prerequisites` (`prerequisite_chapter_id`);--> statement-breakpoint
CREATE INDEX `idx_client_associations_client_id` ON `client_associations` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_client_associations_professional_id` ON `client_associations` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_client_associations_organization_id` ON `client_associations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_client_discovery_client` ON `client_discovery` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_client_discovery_advisor` ON `client_discovery` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_client_goals_client` ON `client_goals` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_client_goals_advisor` ON `client_goals` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_client_goals_node` ON `client_goals` (`planning_node_id`);--> statement-breakpoint
CREATE INDEX `idx_client_goals_category` ON `client_goals` (`goal_category`);--> statement-breakpoint
CREATE INDEX `idx_client_segments_client_id` ON `client_segments` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_client_segments_professional_id` ON `client_segments` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_coaching_messages_user_id` ON `coaching_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_coaching_messages_organization_id` ON `coaching_messages` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_coi_contacts_professional_id` ON `coi_contacts` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_coi_contacts_firm_id` ON `coi_contacts` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_coi_disclosures_user_id` ON `coi_disclosures` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_coi_disclosures_advisor_id` ON `coi_disclosures` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_coi_disclosures_org_id` ON `coi_disclosures` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_coi_disclosures_related_product_id` ON `coi_disclosures` (`related_product_id`);--> statement-breakpoint
CREATE INDEX `idx_coi_disclosures_related_recommendation_id` ON `coi_disclosures` (`related_recommendation_id`);--> statement-breakpoint
CREATE INDEX `idx_comms_log_user_id` ON `comms_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_comms_log_client_id` ON `comms_log` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_comms_log_template_id` ON `comms_log` (`template_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_message_id` ON `compliance_audit` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_user_id` ON `compliance_audit` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_conversation_id` ON `compliance_audit` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_reviewer_id` ON `compliance_audit` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_samples_supervisor` ON `compliance_audit_samples` (`supervisor_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_audit_samples_status` ON `compliance_audit_samples` (`status`);--> statement-breakpoint
CREATE INDEX `idx_compliance_flags_review_id` ON `compliance_flags` (`reviewId`);--> statement-breakpoint
CREATE INDEX `idx_compliance_predictions_agent_action_id` ON `compliance_predictions` (`agent_action_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_prescreening_message_id` ON `compliance_prescreening` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_prescreening_conversation_id` ON `compliance_prescreening` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_user_id` ON `compliance_reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_organization_id` ON `compliance_reviews` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_compliance_reviews_reviewer_id` ON `compliance_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_consent_tracking_user_id` ON `consent_tracking` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_constitutional_violations_message_id` ON `constitutional_violations` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_consultation_bookings_user_id` ON `consultation_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_consultation_bookings_professional_id` ON `consultation_bookings` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_consultation_bookings_pre_brief_id` ON `consultation_bookings` (`pre_brief_id`);--> statement-breakpoint
CREATE INDEX `idx_content_shares_content` ON `content_shares` (`content_type`,`content_id`);--> statement-breakpoint
CREATE INDEX `idx_content_shares_owner_id` ON `content_shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_content_shares_shared_with_user` ON `content_shares` (`shared_with_user_id`);--> statement-breakpoint
CREATE INDEX `idx_content_shares_shared_with_org` ON `content_shares` (`shared_with_org_id`);--> statement-breakpoint
CREATE INDEX `idx_context_assembly_log_conversation_id` ON `context_assembly_log` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_context_assembly_log_message_id` ON `context_assembly_log` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_conversation_compliance_scores_conversation_id` ON `conversation_compliance_scores` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_conversation_folders_user_id` ON `conversation_folders` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_conversation_topics_conversation_id` ON `conversation_topics` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_conversation_topics_message_id` ON `conversation_topics` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_conversations_user_id` ON `conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_folder_id` ON `conversations` (`folderId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_organization_id` ON `conversations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_conversations_user_created_at` ON `conversations` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_credit_profiles_user_id` ON `credit_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_credit_profiles_consent_id` ON `credit_profiles` (`consent_id`);--> statement-breakpoint
CREATE INDEX `idx_data_access_audit_adapter` ON `data_access_audit` (`adapter_id`);--> statement-breakpoint
CREATE INDEX `idx_data_access_audit_user` ON `data_access_audit` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_data_access_audit_ts` ON `data_access_audit` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_data_auth_client` ON `data_authorizations` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_data_auth_advisor` ON `data_authorizations` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_data_auth_status` ON `data_authorizations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_data_quality_scores_data_source_id` ON `data_quality_scores` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `idx_data_quality_scores_ingestion_job_id` ON `data_quality_scores` (`ingestion_job_id`);--> statement-breakpoint
CREATE INDEX `idx_data_sources_firm_id` ON `data_sources` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_data_value_scores_record_id` ON `data_value_scores` (`record_id`);--> statement-breakpoint
CREATE INDEX `idx_delegations_delegator_id` ON `delegations` (`delegator_id`);--> statement-breakpoint
CREATE INDEX `idx_delegations_delegate_id` ON `delegations` (`delegate_id`);--> statement-breakpoint
CREATE INDEX `idx_digital_asset_inventory_user_id` ON `digital_asset_inventory` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_disclaimer_audit_conversation_id` ON `disclaimer_audit` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_disclaimer_audit_disclaimer_id` ON `disclaimer_audit` (`disclaimer_id`);--> statement-breakpoint
CREATE INDEX `idx_disclaimer_interactions_disclaimer_id` ON `disclaimer_interactions` (`disclaimer_id`);--> statement-breakpoint
CREATE INDEX `idx_disclaimer_interactions_user_id` ON `disclaimer_interactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_disclaimer_translations_disclaimer_id` ON `disclaimer_translations` (`disclaimer_id`);--> statement-breakpoint
CREATE INDEX `idx_document_annotations_document_id` ON `document_annotations` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_document_annotations_user_id` ON `document_annotations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_document_annotations_parent_id` ON `document_annotations` (`parentId`);--> statement-breakpoint
CREATE INDEX `idx_document_chunks_document_id` ON `document_chunks` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_document_chunks_user_id` ON `document_chunks` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_document_extractions_user_id` ON `document_extractions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_document_extractions_document_id` ON `document_extractions` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_document_extractions_ingestion_job_id` ON `document_extractions` (`ingestionJobId`);--> statement-breakpoint
CREATE INDEX `idx_document_tag_map_document_id` ON `document_tag_map` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_document_tag_map_tag_id` ON `document_tag_map` (`tagId`);--> statement-breakpoint
CREATE INDEX `idx_document_tags_user_id` ON `document_tags` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_document_templates_org_id` ON `document_templates` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_document_versions_document_id` ON `document_versions` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_document_versions_user_id` ON `document_versions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_documents_user_id` ON `documents` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_documents_organization_id` ON `documents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_education_progress_user_id` ON `education_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_education_progress_module_id` ON `education_progress` (`moduleId`);--> statement-breakpoint
CREATE INDEX `idx_education_triggers_education_module_id` ON `education_triggers` (`education_module_id`);--> statement-breakpoint
CREATE INDEX `idx_email_campaigns_user_id` ON `email_campaigns` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_email_campaigns_template_id` ON `email_campaigns` (`template_id`);--> statement-breakpoint
CREATE INDEX `idx_email_sends_campaign_id` ON `email_sends` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_letters_client` ON `engagement_letters` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_letters_advisor` ON `engagement_letters` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_letters_status` ON `engagement_letters` (`status`);--> statement-breakpoint
CREATE INDEX `idx_engagement_scores_user_id` ON `engagement_scores` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_scores_client_id` ON `engagement_scores` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_engagement_scores_organization_id` ON `engagement_scores` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_enrichment_cohorts_dataset_id` ON `enrichment_cohorts` (`datasetId`);--> statement-breakpoint
CREATE INDEX `idx_enrichment_matches_user_id` ON `enrichment_matches` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_enrichment_matches_dataset_id` ON `enrichment_matches` (`datasetId`);--> statement-breakpoint
CREATE INDEX `idx_enrichment_matches_cohort_id` ON `enrichment_matches` (`cohortId`);--> statement-breakpoint
CREATE INDEX `idx_entity_resolution_rules_canonical_entity_id` ON `entity_resolution_rules` (`canonical_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_equity_grants_user_id` ON `equity_grants` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_esignature_tracking_professional_id` ON `esignature_tracking` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_esignature_tracking_client_user_id` ON `esignature_tracking` (`client_user_id`);--> statement-breakpoint
CREATE INDEX `idx_esignature_tracking_envelope_id` ON `esignature_tracking` (`envelope_id`);--> statement-breakpoint
CREATE INDEX `idx_esignature_tracking_related_product_id` ON `esignature_tracking` (`related_product_id`);--> statement-breakpoint
CREATE INDEX `idx_esignature_tracking_related_quote_id` ON `esignature_tracking` (`related_quote_id`);--> statement-breakpoint
CREATE INDEX `idx_estate_documents_client_id` ON `estate_documents` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_estate_documents_attorney_id` ON `estate_documents` (`attorneyId`);--> statement-breakpoint
CREATE INDEX `idx_exchange_analyses_client` ON `exchange_analyses` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_exchange_analyses_advisor` ON `exchange_analyses` (`advisorId`);--> statement-breakpoint
CREATE INDEX `idx_exchange_analyses_status` ON `exchange_analyses` (`status`);--> statement-breakpoint
CREATE INDEX `idx_export_jobs_user_id` ON `export_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_export_jobs_org_id` ON `export_jobs` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_extraction_plan_jobs_plan_id` ON `extraction_plan_jobs` (`plan_id`);--> statement-breakpoint
CREATE INDEX `idx_fairness_test_results_run_id` ON `fairness_test_results` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_fairness_test_results_prompt_id` ON `fairness_test_results` (`prompt_id`);--> statement-breakpoint
CREATE INDEX `idx_feature_flags_organization_id` ON `feature_flags` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_feature_permissions_user_id` ON `feature_permissions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_feature_permissions_org_id` ON `feature_permissions` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_feature_permissions_feature_id` ON `feature_permissions` (`feature_id`);--> statement-breakpoint
CREATE INDEX `idx_feedback_user_id` ON `feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_feedback_message_id` ON `feedback` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_feedback_conversation_id` ON `feedback` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_field_sharing_controls_user_id` ON `field_sharing_controls` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_file_chunks_file_id` ON `file_chunks` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_file_derived_enrichments_file_id` ON `file_derived_enrichments` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_file_derived_enrichments_user_id` ON `file_derived_enrichments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_file_uploads_user_id` ON `file_uploads` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_file_uploads_organization_id` ON `file_uploads` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_file_uploads_connection_id` ON `file_uploads` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_gate_reviews_action_id` ON `gate_reviews` (`actionId`);--> statement-breakpoint
CREATE INDEX `idx_gate_reviews_reviewer_id` ON `gate_reviews` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `idx_gate_reviews_client_id` ON `gate_reviews` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_gate_reviews_professional_id` ON `gate_reviews` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_gate_reviews_firm_id` ON `gate_reviews` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_generated_documents_user_id` ON `generated_documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_generated_documents_organization_id` ON `generated_documents` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_ghl_locations_location_id` ON `ghl_locations` (`location_id`);--> statement-breakpoint
CREATE INDEX `idx_ghl_locations_org` ON `ghl_locations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_ghl_locations_active` ON `ghl_locations` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_health_scores_user_id` ON `health_scores` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_hns_user_lead` ON `hnw_narrative_scores` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_hns_cadence` ON `hnw_narrative_scores` (`recommended_cadence`);--> statement-breakpoint
CREATE INDEX `idx_hypothesis_test_results_hypothesis_id` ON `hypothesis_test_results` (`hypothesis_id`);--> statement-breakpoint
CREATE INDEX `idx_improvement_actions_audit_id` ON `improvement_actions` (`audit_id`);--> statement-breakpoint
CREATE INDEX `idx_improvement_feedback_action_id` ON `improvement_feedback` (`action_id`);--> statement-breakpoint
CREATE INDEX `idx_improvement_feedback_user_id` ON `improvement_feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_improvement_hypotheses_status_created` ON `improvement_hypotheses` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_improvement_signals_type_detected` ON `improvement_signals` (`signal_type`,`detected_at`);--> statement-breakpoint
CREATE INDEX `idx_ingested_records_data_source_id` ON `ingested_records` (`dataSourceId`);--> statement-breakpoint
CREATE INDEX `idx_ingested_records_ingestion_job_id` ON `ingested_records` (`ingestionJobId`);--> statement-breakpoint
CREATE INDEX `idx_ingested_records_entity_id` ON `ingested_records` (`entityId`);--> statement-breakpoint
CREATE INDEX `idx_ingestion_jobs_data_source_id` ON `ingestion_jobs` (`dataSourceId`);--> statement-breakpoint
CREATE INDEX `idx_insight_actions_insight_id` ON `insight_actions` (`insight_id`);--> statement-breakpoint
CREATE INDEX `idx_insurance_applications_client_id` ON `insurance_applications` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_applications_professional_id` ON `insurance_applications` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_applications_gate_review_id` ON `insurance_applications` (`gateReviewId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_applications_reviewer_id` ON `insurance_applications` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_carriers_am_best_id` ON `insurance_carriers` (`am_best_id`);--> statement-breakpoint
CREATE INDEX `idx_insurance_carriers_naic_id` ON `insurance_carriers` (`naic_id`);--> statement-breakpoint
CREATE INDEX `idx_insurance_products_carrier_id` ON `insurance_products` (`carrier_id`);--> statement-breakpoint
CREATE INDEX `idx_insurance_products_compulife_product_id` ON `insurance_products` (`compulife_product_id`);--> statement-breakpoint
CREATE INDEX `idx_insurance_quotes_client_id` ON `insurance_quotes` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_quotes_professional_id` ON `insurance_quotes` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_quotes_quote_run_id` ON `insurance_quotes` (`quoteRunId`);--> statement-breakpoint
CREATE INDEX `idx_bpr_blueprint` ON `integration_blueprint_runs` (`blueprint_id`);--> statement-breakpoint
CREATE INDEX `idx_bpr_status` ON `integration_blueprint_runs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bpr_started` ON `integration_blueprint_runs` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_bps_blueprint` ON `integration_blueprint_samples` (`blueprint_id`);--> statement-breakpoint
CREATE INDEX `idx_bpv_blueprint` ON `integration_blueprint_versions` (`blueprint_id`);--> statement-breakpoint
CREATE INDEX `idx_blueprint_slug` ON `integration_blueprints` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_blueprint_owner` ON `integration_blueprints` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_blueprint_org` ON `integration_blueprints` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_blueprint_status` ON `integration_blueprints` (`status`);--> statement-breakpoint
CREATE INDEX `idx_integration_health_checks_connection_id` ON `integration_health_checks` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_integration_health_checks_provider_id` ON `integration_health_checks` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_integration_health_summary_connection_id` ON `integration_health_summary` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_integration_improvement_log_connection_id` ON `integration_improvement_log` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_integration_improvement_log_provider_id` ON `integration_improvement_log` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_integration_sync_config_connection_id` ON `integration_sync_config` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_iul_crediting_history_product_id` ON `iul_crediting_history` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_kb_access_transitions_owner_id` ON `kb_access_transitions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_kb_access_transitions_from_grantee_id` ON `kb_access_transitions` (`from_grantee_id`);--> statement-breakpoint
CREATE INDEX `idx_kb_access_transitions_to_grantee_id` ON `kb_access_transitions` (`to_grantee_id`);--> statement-breakpoint
CREATE INDEX `idx_kb_sharing_permissions_owner_id` ON `kb_sharing_permissions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_kb_sharing_permissions_grantee_id` ON `kb_sharing_permissions` (`grantee_id`);--> statement-breakpoint
CREATE INDEX `idx_kg_edges_user_id` ON `kg_edges` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_kg_edges_source_node_id` ON `kg_edges` (`sourceNodeId`);--> statement-breakpoint
CREATE INDEX `idx_kg_edges_target_node_id` ON `kg_edges` (`targetNodeId`);--> statement-breakpoint
CREATE INDEX `idx_kg_nodes_user_id` ON `kg_nodes` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_article_feedback_article_id` ON `knowledge_article_feedback` (`article_id`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_article_feedback_user_id` ON `knowledge_article_feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_article_versions_article_id` ON `knowledge_article_versions` (`article_id`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_gap_feedback_user_id` ON `knowledge_gap_feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_gap_feedback_gap_id` ON `knowledge_gap_feedback` (`gapId`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_graph_edges_from_entity_id` ON `knowledge_graph_edges` (`from_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_graph_edges_to_entity_id` ON `knowledge_graph_edges` (`to_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_layer_audits_target_id` ON `layer_audits` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_layer_metrics_target_id` ON `layer_metrics` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_lp_status` ON `lead_pipeline` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lp_ghl_contact` ON `lead_pipeline` (`ghl_contact_id`);--> statement-breakpoint
CREATE INDEX `idx_lp_assigned_advisor` ON `lead_pipeline` (`assigned_advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_lead_profile_ident` ON `lead_profile_accumulator` (`identifier_type`,`identifier_value`);--> statement-breakpoint
CREATE INDEX `idx_learning_achievements_user` ON `learning_achievements` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_aiq_discipline` ON `learning_ai_quiz_questions` (`discipline`);--> statement-breakpoint
CREATE INDEX `idx_learning_bookmarks_user` ON `learning_bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_ce_credits_user` ON `learning_ce_credits` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_ce_credits_license` ON `learning_ce_credits` (`license_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_challenge_results_challenge` ON `learning_challenge_results` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_chapters_track` ON `learning_chapters` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_ch_content` ON `learning_content_history` (`content_table`,`content_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_cv_source_key` ON `learning_content_versions` (`content_source`,`content_key`);--> statement-breakpoint
CREATE INDEX `idx_learning_def_discipline` ON `learning_definitions` (`discipline_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_def_term` ON `learning_definitions` (`term`);--> statement-breakpoint
CREATE INDEX `idx_learning_discovery_user` ON `learning_discovery_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_fc_track` ON `learning_flashcards` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_group_activity_group` ON `learning_group_activity` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_group_goals_group` ON `learning_group_goals` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_group_members_group` ON `learning_group_members` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_group_members_user` ON `learning_group_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_group_notes_group` ON `learning_group_notes` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_licenses_user` ON `learning_licenses` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_licenses_type` ON `learning_licenses` (`license_type`);--> statement-breakpoint
CREATE INDEX `idx_learning_mastery_user` ON `learning_mastery_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_mastery_item` ON `learning_mastery_progress` (`item_key`);--> statement-breakpoint
CREATE INDEX `idx_learning_playlist_items_playlist` ON `learning_playlist_items` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_pq_track` ON `learning_practice_questions` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_pq_chapter` ON `learning_practice_questions` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_reg_status` ON `learning_regulatory_updates` (`reg_status`);--> statement-breakpoint
CREATE INDEX `idx_learning_settings_user_key` ON `learning_settings` (`user_id`,`setting_key`);--> statement-breakpoint
CREATE INDEX `idx_ls_flag` ON `learning_streaks` (`feature_flag`);--> statement-breakpoint
CREATE INDEX `idx_learning_sessions_user` ON `learning_study_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_subsections_chapter` ON `learning_subsections` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `idx_learning_tracks_category` ON `learning_tracks` (`category`);--> statement-breakpoint
CREATE INDEX `idx_lat_location_metric` ON `location_alert_thresholds` (`location_db_id`,`metric_name`);--> statement-breakpoint
CREATE INDEX `idx_lat_location` ON `location_alert_thresholds` (`location_db_id`);--> statement-breakpoint
CREATE INDEX `idx_lat_enabled` ON `location_alert_thresholds` (`enabled`);--> statement-breakpoint
CREATE INDEX `idx_ltc_analyses_user_id` ON `ltc_analyses` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_market_data_subscriptions_user_id` ON `market_data_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_meddpicc_user_lead` ON `meddpicc_scores` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_meddpicc_tier` ON `meddpicc_scores` (`tier`);--> statement-breakpoint
CREATE INDEX `idx_meeting_action_items_meeting_id` ON `meeting_action_items` (`meetingId`);--> statement-breakpoint
CREATE INDEX `idx_meeting_action_items_user_id` ON `meeting_action_items` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_meetings_user_id` ON `meetings` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_meetings_organization_id` ON `meetings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_meetings_client_id` ON `meetings` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_memories_user_id` ON `memories` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_memory_episodes_user_id` ON `memory_episodes` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_memory_episodes_conversation_id` ON `memory_episodes` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_id` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_messages_user_id` ON `messages` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_mfa_backup_codes_user_id` ON `mfa_backup_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_mfa_secrets_user_id` ON `mfa_secrets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_model_backtests_user_id` ON `model_backtests` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_model_output_records_run_id` ON `model_output_records` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_model_output_records_model_id` ON `model_output_records` (`model_id`);--> statement-breakpoint
CREATE INDEX `idx_model_output_records_entity_id` ON `model_output_records` (`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_model_runs_model_id` ON `model_runs` (`model_id`);--> statement-breakpoint
CREATE INDEX `idx_model_scenarios_user_id` ON `model_scenarios` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_model_scenarios_base_run_id` ON `model_scenarios` (`base_run_id`);--> statement-breakpoint
CREATE INDEX `idx_model_schedules_model_id` ON `model_schedules` (`model_id`);--> statement-breakpoint
CREATE INDEX `idx_nitrogen_risk_profiles_user_id` ON `nitrogen_risk_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_log_user_id` ON `notification_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_notification_log_user_read` ON `notification_log` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `idx_ohr_oh` ON `office_hour_registrations` (`office_hour_id`);--> statement-breakpoint
CREATE INDEX `idx_ohr_user` ON `office_hour_registrations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_oh_host` ON `office_hours` (`host_user_id`);--> statement-breakpoint
CREATE INDEX `idx_oh_track` ON `office_hours` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_oh_status` ON `office_hours` (`status`);--> statement-breakpoint
CREATE INDEX `idx_oh_scheduled` ON `office_hours` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_onboarding_progress_user_id` ON `onboarding_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_org_ai_config_org_id` ON `org_ai_config` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_org_prompt_customizations_org_id` ON `org_prompt_customizations` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_org_retention_policies_org_id` ON `org_retention_policies` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_organization_landing_page_config_organization_id` ON `organization_landing_page_config` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_organization_relationships_parent_org_id` ON `organization_relationships` (`parentOrgId`);--> statement-breakpoint
CREATE INDEX `idx_organization_relationships_child_org_id` ON `organization_relationships` (`childOrgId`);--> statement-breakpoint
CREATE INDEX `idx_paper_trades_user_id` ON `paper_trades` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_passive_action_log_user_id` ON `passive_action_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_passive_action_log_preference_id` ON `passive_action_log` (`preference_id`);--> statement-breakpoint
CREATE INDEX `idx_passive_action_preferences_user_id` ON `passive_action_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pta_user` ON `pattern_transition_assessments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pta_assessed_at` ON `pattern_transition_assessments` (`assessed_at`);--> statement-breakpoint
CREATE INDEX `idx_pgm_group` ON `peer_group_members` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_pgm_user` ON `peer_group_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pgmsg_group` ON `peer_group_messages` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_peer_groups_track` ON `peer_groups` (`track_id`);--> statement-breakpoint
CREATE INDEX `idx_peer_groups_status` ON `peer_groups` (`status`);--> statement-breakpoint
CREATE INDEX `idx_perm_audit_actor_id` ON `permission_audit_log` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_perm_audit_target_user_id` ON `permission_audit_log` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `idx_perm_audit_action_type` ON `permission_audit_log` (`action_type`);--> statement-breakpoint
CREATE INDEX `idx_perm_audit_created_at` ON `permission_audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pfr_client` ON `personal_financial_reviews` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_pfr_advisor` ON `personal_financial_reviews` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_pfr_review_type` ON `personal_financial_reviews` (`review_type`);--> statement-breakpoint
CREATE INDEX `idx_pfm_imports_user` ON `pfm_imports` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pfm_imports_status` ON `pfm_imports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pfr_client` ON `pfr_documents` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_pfr_advisor` ON `pfr_documents` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_pfr_status` ON `pfr_documents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_plaid_holdings_user_id` ON `plaid_holdings` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_plaid_holdings_account_id` ON `plaid_holdings` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_plaid_holdings_security_id` ON `plaid_holdings` (`security_id`);--> statement-breakpoint
CREATE INDEX `idx_plaid_webhook_log_item_id` ON `plaid_webhook_log` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_plaid_webhooks_log_item_id` ON `plaid_webhooks_log` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_plan_adherence_user_id` ON `plan_adherence` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_planning_assumptions_owner` ON `planning_assumptions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_assumptions_scope` ON `planning_assumptions` (`assumption_scope`,`scope_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_nodes_parent` ON `planning_nodes` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_nodes_owner` ON `planning_nodes` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_nodes_level` ON `planning_nodes` (`level`);--> statement-breakpoint
CREATE INDEX `idx_planning_nodes_entity` ON `planning_nodes` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_refs_node` ON `planning_references` (`planning_node_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_refs_type` ON `planning_references` (`ref_type`);--> statement-breakpoint
CREATE INDEX `idx_planning_snapshots_client` ON `planning_snapshots` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_planning_snapshots_date` ON `planning_snapshots` (`snapshot_date`);--> statement-breakpoint
CREATE INDEX `idx_planning_snapshots_type` ON `planning_snapshots` (`snapshot_type`);--> statement-breakpoint
CREATE INDEX `idx_platform_learnings_type_confidence` ON `platform_learnings` (`learning_type`,`confidence`);--> statement-breakpoint
CREATE INDEX `idx_policy_deliveries_client` ON `policy_deliveries` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_policy_deliveries_advisor` ON `policy_deliveries` (`advisorId`);--> statement-breakpoint
CREATE INDEX `idx_policy_deliveries_application` ON `policy_deliveries` (`applicationId`);--> statement-breakpoint
CREATE INDEX `idx_policy_deliveries_status` ON `policy_deliveries` (`status`);--> statement-breakpoint
CREATE INDEX `idx_policy_deliveries_free_look` ON `policy_deliveries` (`freeLookStatus`,`freeLookEndDate`);--> statement-breakpoint
CREATE INDEX `idx_portal_engagement_user_id` ON `portal_engagement` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_practice_metrics_professional_id` ON `practice_metrics` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_practice_metrics_firm_id` ON `practice_metrics` (`firmId`);--> statement-breakpoint
CREATE INDEX `idx_premium_finance_cases_client_id` ON `premium_finance_cases` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_premium_finance_cases_professional_id` ON `premium_finance_cases` (`professionalId`);--> statement-breakpoint
CREATE INDEX `idx_premium_finance_cases_gate_review_id` ON `premium_finance_cases` (`gateReviewId`);--> statement-breakpoint
CREATE INDEX `idx_privacy_audit_user_id` ON `privacy_audit` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_privacy_consent_log_client` ON `privacy_consent_log` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_privacy_consent_log_type` ON `privacy_consent_log` (`consent_type`);--> statement-breakpoint
CREATE INDEX `idx_proactive_insights_user_id` ON `proactive_insights` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_proactive_insights_organization_id` ON `proactive_insights` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_proactive_insights_client_id` ON `proactive_insights` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_product_suitability_evaluations_product_id` ON `product_suitability_evaluations` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_product_suitability_evaluations_user_id` ON `product_suitability_evaluations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_products_organization_id` ON `products` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_professional_availability_professional_id` ON `professional_availability` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_professional_context_user_id` ON `professional_context` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_professional_relationships_user_id` ON `professional_relationships` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_professional_relationships_professional_id` ON `professional_relationships` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_professional_reviews_professional_id` ON `professional_reviews` (`professional_id`);--> statement-breakpoint
CREATE INDEX `idx_professional_reviews_user_id` ON `professional_reviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_professionals_linked_user_id` ON `professionals` (`linked_user_id`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiment_results_variant_a_id` ON `prompt_experiment_results` (`variant_a_id`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiment_results_variant_b_id` ON `prompt_experiment_results` (`variant_b_id`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiment_results_winner_id` ON `prompt_experiment_results` (`winner_id`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiments_variant_id` ON `prompt_experiments` (`variantId`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiments_conversation_id` ON `prompt_experiments` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_prompt_experiments_message_id` ON `prompt_experiments` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_prompt_interactions_user_id` ON `prompt_interactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_prompt_regression_runs_variant_id` ON `prompt_regression_runs` (`variant_id`);--> statement-breakpoint
CREATE INDEX `idx_propagation_actions_event_id` ON `propagation_actions` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_propagation_actions_actor_id` ON `propagation_actions` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_propagation_events_source_entity_id` ON `propagation_events` (`source_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_propagation_events_target_entity_id` ON `propagation_events` (`target_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_quality_ratings_message_id` ON `quality_ratings` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_quality_ratings_conversation_id` ON `quality_ratings` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_reasoning_traces_session_id` ON `reasoning_traces` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_log_user_id` ON `recommendations_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_log_advisor_id` ON `recommendations_log` (`advisor_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_log_conversation_id` ON `recommendations_log` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_log_message_id` ON `recommendations_log` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_log_product_id` ON `recommendations_log` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_log_account_id` ON `reconciliation_log` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_rds_user_lead` ON `recruit_dimension_scores` (`user_id`,`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_rds_tier` ON `recruit_dimension_scores` (`tier`);--> statement-breakpoint
CREATE INDEX `idx_rds_composite` ON `recruit_dimension_scores` (`composite_score`);--> statement-breakpoint
CREATE INDEX `idx_referrals_from_professional_id` ON `referrals` (`fromProfessionalId`);--> statement-breakpoint
CREATE INDEX `idx_referrals_to_coi_id` ON `referrals` (`toCoiId`);--> statement-breakpoint
CREATE INDEX `idx_referrals_client_id` ON `referrals` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_regulatory_impact_analyses_update_id` ON `regulatory_impact_analyses` (`update_id`);--> statement-breakpoint
CREATE INDEX `idx_report_jobs_user_id` ON `report_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_report_jobs_org_id` ON `report_jobs` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_report_jobs_template_id` ON `report_jobs` (`template_id`);--> statement-breakpoint
CREATE INDEX `idx_report_jobs_client_id` ON `report_jobs` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_report_templates_org_id` ON `report_templates` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_response_ratings_user_type` ON `response_ratings` (`user_id`,`response_type`);--> statement-breakpoint
CREATE INDEX `idx_review_queue_user_id` ON `review_queue` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_review_queue_conversation_id` ON `review_queue` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_review_queue_message_id` ON `review_queue` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_rich_media_message` ON `rich_media_embeds` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_role_elevations_user_id` ON `role_elevations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_analyses_user_id` ON `saved_analyses` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_analyses_client_id` ON `saved_analyses` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_scrape_schedules_data_source_id` ON `scrape_schedules` (`data_source_id`);--> statement-breakpoint
CREATE INDEX `idx_self_discovery_history_user_id` ON `self_discovery_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_self_discovery_history_conversation_id` ON `self_discovery_history` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_self_discovery_history_trigger_message_id` ON `self_discovery_history` (`trigger_message_id`);--> statement-breakpoint
CREATE INDEX `idx_server_errors_user_id` ON `server_errors` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_shared_assumptions_owner` ON `shared_assumptions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_shared_assumptions_scope` ON `shared_assumptions` (`scope`,`scope_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_student_loans_user_id` ON `student_loans` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_study_progress_user_id` ON `study_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_assessments_user_id` ON `suitability_assessments` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_suitability_change_events_profile_id` ON `suitability_change_events` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_dimensions_profile_id` ON `suitability_dimensions` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_household_links_primary_user_id` ON `suitability_household_links` (`primary_user_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_household_links_linked_user_id` ON `suitability_household_links` (`linked_user_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_profiles_user_id` ON `suitability_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_profiles_organization_id` ON `suitability_profiles` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_suitability_questions_queue_user_id` ON `suitability_questions_queue` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sem_channel` ON `sync_event_metrics` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_sem_location` ON `sync_event_metrics` (`location_id`);--> statement-breakpoint
CREATE INDEX `idx_sem_detected` ON `sync_event_metrics` (`detected_at`);--> statement-breakpoint
CREATE INDEX `idx_sem_event_type` ON `sync_event_metrics` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_sem_contact` ON `sync_event_metrics` (`contact_external_id`);--> statement-breakpoint
CREATE INDEX `idx_srh_status` ON `sync_run_history` (`status`);--> statement-breakpoint
CREATE INDEX `idx_srh_started` ON `sync_run_history` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_health_events_type` ON `system_health_events` (`health_event_type`,`health_severity`);--> statement-breakpoint
CREATE INDEX `idx_health_events_source` ON `system_health_events` (`source_name`);--> statement-breakpoint
CREATE INDEX `idx_tax_return_reviews_client` ON `tax_return_reviews` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_tax_return_reviews_advisor` ON `tax_return_reviews` (`advisorId`);--> statement-breakpoint
CREATE INDEX `idx_tax_return_reviews_year` ON `tax_return_reviews` (`taxYear`);--> statement-breakpoint
CREATE INDEX `idx_tax_return_reviews_status` ON `tax_return_reviews` (`status`);--> statement-breakpoint
CREATE INDEX `idx_template_opt_template_model` ON `template_optimization_results` (`template_id`,`model`);--> statement-breakpoint
CREATE INDEX `idx_transaction_categories_transaction_id` ON `transaction_categories` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_transaction_categories_user_id` ON `transaction_categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_underwriting_tracking_client` ON `underwriting_tracking` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_underwriting_tracking_status` ON `underwriting_tracking` (`status`);--> statement-breakpoint
CREATE INDEX `idx_usage_tracking_user_date` ON `usage_tracking` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_user_ai_boundaries_user_id` ON `user_ai_boundaries` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_apps_owner_idx` ON `user_apps` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `user_apps_visibility_idx` ON `user_apps` (`visibility_user_apps`);--> statement-breakpoint
CREATE INDEX `idx_audio_overrides_user_script` ON `user_audio_overrides` (`user_id`,`audio_script_id`);--> statement-breakpoint
CREATE INDEX `idx_user_autonomy_profiles_user_id` ON `user_autonomy_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_changelog_awareness_user_id` ON `user_changelog_awareness` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_changelog_awareness_changelog_id` ON `user_changelog_awareness` (`changelog_id`);--> statement-breakpoint
CREATE INDEX `idx_user_consents_user_id` ON `user_consents` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_feature_proficiency_user_id` ON `user_feature_proficiency` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_guardrails_user_id` ON `user_guardrails` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_insights_cache_user_id` ON `user_insights_cache` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_locations_user` ON `user_locations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_locations_location` ON `user_locations` (`ghl_location_id`);--> statement-breakpoint
CREATE INDEX `idx_user_locations_unique` ON `user_locations` (`user_id`,`ghl_location_id`);--> statement-breakpoint
CREATE INDEX `idx_user_memories_user_cat` ON `user_memories` (`user_id`,`memory_category`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_events_user_id` ON `user_platform_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_platform_events_session_id` ON `user_platform_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_user_id` ON `user_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_relationships_user_id` ON `user_relationships` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_relationships_related_user_id` ON `user_relationships` (`relatedUserId`);--> statement-breakpoint
CREATE INDEX `idx_user_relationships_organization_id` ON `user_relationships` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_view_as_audit_log_actor_id` ON `view_as_audit_log` (`actorId`);--> statement-breakpoint
CREATE INDEX `idx_view_as_audit_log_target_user_id` ON `view_as_audit_log` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `idx_view_as_audit_log_organization_id` ON `view_as_audit_log` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_view_shares_owner_id` ON `view_shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_view_shares_shared_with_user` ON `view_shares` (`shared_with_user_id`);--> statement-breakpoint
CREATE INDEX `idx_view_shares_view_type` ON `view_shares` (`view_type`);--> statement-breakpoint
CREATE INDEX `idx_wha_user` ON `wealth_hub_allocations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_wha_hub_type` ON `wealth_hub_allocations` (`hub_type`);--> statement-breakpoint
CREATE INDEX `idx_wha_default` ON `wealth_hub_allocations` (`is_default`);--> statement-breakpoint
CREATE INDEX `idx_web_scrape_results_data_source_id` ON `web_scrape_results` (`dataSourceId`);--> statement-breakpoint
CREATE INDEX `idx_web_scrape_results_ingestion_job_id` ON `web_scrape_results` (`ingestionJobId`);--> statement-breakpoint
CREATE INDEX `idx_weight_presets_user_id` ON `weight_presets` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_workflow_checklist_user_id` ON `workflow_checklist` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_workflow_checkpoints_workflow_id` ON `workflow_checkpoints` (`workflow_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_checkpoints_agent_run_id` ON `workflow_checkpoints` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_execution_log_chain_id` ON `workflow_execution_log` (`chain_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_instances_user` ON `workflow_instances` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_instances_user_template` ON `workflow_instances` (`user_id`,`template_id`);--> statement-breakpoint
CREATE INDEX `idx_zip_demographics_county` ON `zip_code_demographics` (`county`);--> statement-breakpoint
CREATE INDEX `idx_zip_demographics_wealth` ON `zip_code_demographics` (`wealth_index`);