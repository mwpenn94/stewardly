CREATE TABLE IF NOT EXISTS `market_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`magnitude` float,
	`details` text,
	`insight_generated` boolean DEFAULT false,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `market_index_history` (
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

CREATE TABLE IF NOT EXISTS `meddpicc_scores` (
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

CREATE TABLE IF NOT EXISTS `medicare_parameters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parameter_year` int NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`value_json` json NOT NULL,
	`source_url` varchar(500),
	`effective_date` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicare_parameters_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `meeting_action_items` (
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

CREATE TABLE IF NOT EXISTS `meetings` (
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

CREATE TABLE IF NOT EXISTS `memories` (
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

CREATE TABLE IF NOT EXISTS `memory_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int NOT NULL,
	`summary` text NOT NULL,
	`keyTopics` json,
	`emotionalTone` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memory_episodes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `messages` (
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

CREATE TABLE IF NOT EXISTS `mfa_backup_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mfa_backup_codes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `mfa_secrets` (
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

CREATE TABLE IF NOT EXISTS `model_backtests` (
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

CREATE TABLE IF NOT EXISTS `model_cards` (
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

CREATE TABLE IF NOT EXISTS `model_output_records` (
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

CREATE TABLE IF NOT EXISTS `model_runs` (
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

CREATE TABLE IF NOT EXISTS `model_scenarios` (
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

CREATE TABLE IF NOT EXISTS `model_schedules` (
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

CREATE TABLE IF NOT EXISTS `nitrogen_risk_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nitrogen_risk_number` int,
	`portfolio_risk_number` int,
	`risk_alignment_score` int,
	`last_synced_at` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nitrogen_risk_profiles_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `notification_log` (
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

CREATE TABLE IF NOT EXISTS `office_hour_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`office_hour_id` int NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('registered','attended','no_show','cancelled') NOT NULL DEFAULT 'registered',
	`registered_at` timestamp DEFAULT (now()),
	CONSTRAINT `office_hour_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_ohr_unique` UNIQUE(`office_hour_id`,`user_id`)
);

CREATE TABLE IF NOT EXISTS `office_hours` (
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

CREATE TABLE IF NOT EXISTS `onboarding_progress` (
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

CREATE TABLE IF NOT EXISTS `org_ai_config` (
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

CREATE TABLE IF NOT EXISTS `org_prompt_customizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`prompt_text` text NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewed_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_prompt_customizations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `org_retention_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`data_category` varchar(128) NOT NULL,
	`retention_days` int NOT NULL,
	`action` enum('delete','archive','anonymize') DEFAULT 'archive',
	`configured_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_retention_policies_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `organization_ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`organizationName` varchar(256) NOT NULL,
	`brandVoice` text,
	`approvedProductCategories` json,
	`prohibitedTopics` json,
	`complianceLanguage` text,
	`customDisclaimers` text,
	`promptOverlay` text,
	`toneStyle` varchar(64) DEFAULT 'professional',
	`responseFormat` varchar(64) DEFAULT 'mixed',
	`responseLength` varchar(64) DEFAULT 'standard',
	`modelPreferences` json,
	`ensembleWeights` json,
	`temperature` float,
	`maxTokens` int,
	`enabledFocusModes` json,
	`defaultTtsVoice` varchar(64),
	`defaultSpeechRate` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_ai_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_ai_settings_organizationId_unique` UNIQUE(`organizationId`)
);

CREATE TABLE IF NOT EXISTS `organization_landing_page_config` (
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

CREATE TABLE IF NOT EXISTS `organization_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentOrgId` int NOT NULL,
	`childOrgId` int NOT NULL,
	`relationshipType` enum('partner','subsidiary','affiliate','referral','vendor','client') NOT NULL,
	`status` enum('active','inactive','pending') DEFAULT 'active',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_relationships_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`website` varchar(512),
	`ein` varchar(20),
	`industry` varchar(128),
	`size` enum('solo','small','medium','large','enterprise') DEFAULT 'small',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `paper_trades` (
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
