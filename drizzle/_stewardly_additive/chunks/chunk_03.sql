CREATE TABLE IF NOT EXISTS `compensation_brackets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bracket_name` varchar(100) NOT NULL,
	`gdc_min` decimal(12,2),
	`gdc_max` decimal(12,2),
	`commission_rate` decimal(5,2),
	`role_segment` varchar(100),
	`effective_date` date,
	CONSTRAINT `compensation_brackets_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `compliance_audit` (
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

CREATE TABLE IF NOT EXISTS `compliance_audit_samples` (
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

CREATE TABLE IF NOT EXISTS `compliance_flags` (
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

CREATE TABLE IF NOT EXISTS `compliance_predictions` (
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

CREATE TABLE IF NOT EXISTS `compliance_prescreening` (
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

CREATE TABLE IF NOT EXISTS `compliance_reviews` (
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

CREATE TABLE IF NOT EXISTS `compliance_rules` (
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

CREATE TABLE IF NOT EXISTS `compliance_weekly_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`week_start` date NOT NULL,
	`brief_json` json,
	`distributed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_weekly_briefs_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `consent_tracking` (
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

CREATE TABLE IF NOT EXISTS `constitutional_violations` (
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

CREATE TABLE IF NOT EXISTS `consultation_bookings` (
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

CREATE TABLE IF NOT EXISTS `content_articles` (
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

CREATE TABLE IF NOT EXISTS `content_shares` (
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

CREATE TABLE IF NOT EXISTS `context_assembly_log` (
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

CREATE TABLE IF NOT EXISTS `conversation_compliance_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`score` int DEFAULT 100,
	`checks_run` int DEFAULT 0,
	`checks_passed` int DEFAULT 0,
	`flagged_for_review` boolean DEFAULT false,
	`last_updated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_compliance_scores_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversation_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(32) DEFAULT '#6366f1',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_folders_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversation_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`message_id` int,
	`topic` varchar(128) NOT NULL,
	`previous_topic` varchar(128),
	`disclaimer_injected` boolean DEFAULT false,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_topics_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `conversations` (
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

CREATE TABLE IF NOT EXISTS `credit_profiles` (
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

CREATE TABLE IF NOT EXISTS `crm_sync_log` (
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

CREATE TABLE IF NOT EXISTS `data_access_audit` (
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

CREATE TABLE IF NOT EXISTS `data_authorizations` (
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

CREATE TABLE IF NOT EXISTS `data_freshness_registry` (
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

CREATE TABLE IF NOT EXISTS `data_quality_scores` (
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

CREATE TABLE IF NOT EXISTS `data_sources` (
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

CREATE TABLE IF NOT EXISTS `data_value_scores` (
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

CREATE TABLE IF NOT EXISTS `delegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`delegator_id` int NOT NULL,
	`delegate_id` int NOT NULL,
	`scope` json,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`active` boolean DEFAULT true,
	CONSTRAINT `delegations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `deployment_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`check_type` varchar(64) NOT NULL,
	`passed` boolean DEFAULT false,
	`details` text,
	`duration_ms` int,
	`run_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deployment_checks_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `deployment_history` (
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
