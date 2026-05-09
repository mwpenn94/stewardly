CREATE TABLE IF NOT EXISTS `smsit_sync_log` (
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

CREATE TABLE IF NOT EXISTS `snaptrade_accounts` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`snaptrade_account_id` varchar(200) NOT NULL,
	`account_name` varchar(200),
	`account_number` varchar(100),
	`account_type` varchar(100),
	`institution_name` varchar(200),
	`cash_balance` decimal(18,4),
	`market_value` decimal(18,4),
	`total_value` decimal(18,4),
	`currency` varchar(10) DEFAULT 'USD',
	`last_sync_at` timestamp,
	`sync_data_json` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snaptrade_accounts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `snaptrade_brokerage_connections` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`snaptrade_user_id` varchar(36) NOT NULL,
	`brokerage_authorization_id` varchar(200) NOT NULL,
	`brokerage_name` varchar(200),
	`brokerage_type` varchar(100),
	`status` enum('active','disabled','error','deleted') NOT NULL DEFAULT 'active',
	`disabled_reason` text,
	`last_sync_at` timestamp,
	`last_sync_status` enum('success','partial','failed'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snaptrade_brokerage_connections_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `snaptrade_positions` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`symbol_ticker` varchar(20),
	`symbol_name` varchar(300),
	`symbol_type` varchar(50),
	`units` decimal(18,8),
	`average_price` decimal(18,4),
	`current_price` decimal(18,4),
	`market_value` decimal(18,4),
	`currency` varchar(10) DEFAULT 'USD',
	`raw_json` json,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snaptrade_positions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `snaptrade_users` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`snaptrade_user_id` varchar(200) NOT NULL,
	`snaptrade_user_secret_encrypted` text NOT NULL,
	`status` enum('active','disabled','deleted') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snaptrade_users_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ssa_life_tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`age` int NOT NULL,
	`sex` varchar(10) NOT NULL,
	`probability_of_death` varchar(20) NOT NULL,
	`life_expectancy` varchar(10) NOT NULL,
	`table_year` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ssa_life_tables_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ssa_parameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parameter_year` int NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`value_json` json NOT NULL,
	`source_url` varchar(500),
	`effective_date` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ssa_parameters_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `student_loans` (
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

CREATE TABLE IF NOT EXISTS `study_progress` (
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

CREATE TABLE IF NOT EXISTS `suitability_assessments` (
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

CREATE TABLE IF NOT EXISTS `suitability_change_events` (
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

CREATE TABLE IF NOT EXISTS `suitability_dimensions` (
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

CREATE TABLE IF NOT EXISTS `suitability_household_links` (
	`id` varchar(36) NOT NULL,
	`primary_user_id` int NOT NULL,
	`linked_user_id` int NOT NULL,
	`relationship` enum('spouse','partner','dependent','parent','sibling','other') NOT NULL,
	`shared_dimensions` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suitability_household_links_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `suitability_profiles` (
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

CREATE TABLE IF NOT EXISTS `suitability_questions_queue` (
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

CREATE TABLE IF NOT EXISTS `sync_event_metrics` (
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

CREATE TABLE IF NOT EXISTS `sync_run_history` (
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

CREATE TABLE IF NOT EXISTS `system_health_events` (
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

CREATE TABLE IF NOT EXISTS `tax_parameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tax_year` int NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`parameter_category` varchar(50) NOT NULL,
	`filing_status` varchar(50) DEFAULT 'all',
	`value_json` json NOT NULL,
	`source_url` varchar(500),
	`effective_date` varchar(20) NOT NULL,
	`expiry_date` varchar(20),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_parameters_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `tax_return_reviews` (
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

CREATE TABLE IF NOT EXISTS `template_optimization_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int,
	`model` varchar(100),
	`domain` varchar(50),
	`avg_score` decimal(3,2),
	`sample_count` int,
	`tested_at` timestamp DEFAULT (now()),
	CONSTRAINT `template_optimization_results_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `transaction_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` varchar(256) NOT NULL,
	`user_id` int NOT NULL,
	`ai_category` varchar(128),
	`user_override_category` varchar(128),
	`confidence` float,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_categories_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `underwriting_tracking` (
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

CREATE TABLE IF NOT EXISTS `usage_budgets` (
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

CREATE TABLE IF NOT EXISTS `usage_tracking` (
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

CREATE TABLE IF NOT EXISTS `user_ai_boundaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`boundary_type` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_ai_boundaries_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_audio_overrides` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`audio_script_id` varchar(36) NOT NULL,
	`personalized_script` text NOT NULL,
	`personalized_ssml` text,
	`user_instruction` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_audio_overrides_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `user_audio_preferences` (
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

CREATE TABLE IF NOT EXISTS `user_autonomy_profiles` (
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

CREATE TABLE IF NOT EXISTS `user_capabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`capability` varchar(100) NOT NULL,
	`granted` boolean DEFAULT false,
	`granted_by` int,
	`granted_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_capabilities_id` PRIMARY KEY(`id`)
);
