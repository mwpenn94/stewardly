CREATE TABLE IF NOT EXISTS `quality_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`score` float NOT NULL,
	`reasoning` text,
	`improvementSuggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_ratings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `rate_profiles` (
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

CREATE TABLE IF NOT EXISTS `rate_recommendations` (
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

CREATE TABLE IF NOT EXISTS `rate_signal_log` (
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

CREATE TABLE IF NOT EXISTS `reasoning_traces` (
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

CREATE TABLE IF NOT EXISTS `recommendations_log` (
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

CREATE TABLE IF NOT EXISTS `reconciliation_log` (
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

CREATE TABLE IF NOT EXISTS `recruit_dimension_scores` (
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

CREATE TABLE IF NOT EXISTS `referral_tracking` (
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

CREATE TABLE IF NOT EXISTS `referrals` (
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

CREATE TABLE IF NOT EXISTS `regulatory_alerts` (
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

CREATE TABLE IF NOT EXISTS `regulatory_impact_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`update_id` int NOT NULL,
	`impact_level` enum('high','medium','low') DEFAULT 'low',
	`affected_areas` json,
	`recommended_actions` json,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regulatory_impact_analyses_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `regulatory_updates` (
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

CREATE TABLE IF NOT EXISTS `report_jobs` (
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

CREATE TABLE IF NOT EXISTS `report_snapshots` (
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

CREATE TABLE IF NOT EXISTS `report_templates` (
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

CREATE TABLE IF NOT EXISTS `response_ratings` (
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

CREATE TABLE IF NOT EXISTS `retention_actions_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data_type` varchar(128) NOT NULL,
	`action` enum('delete','archive','anonymize') NOT NULL,
	`records_affected` int DEFAULT 0,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `retention_actions_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `review_queue` (
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

CREATE TABLE IF NOT EXISTS `rich_media_embeds` (
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

CREATE TABLE IF NOT EXISTS `role_elevations` (
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

CREATE TABLE IF NOT EXISTS `saved_analyses` (
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

CREATE TABLE IF NOT EXISTS `scrape_schedules` (
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

CREATE TABLE IF NOT EXISTS `scraping_audit` (
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

CREATE TABLE IF NOT EXISTS `scraping_cache` (
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

CREATE TABLE IF NOT EXISTS `search_cache` (
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

CREATE TABLE IF NOT EXISTS `self_discovery_history` (
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

CREATE TABLE IF NOT EXISTS `server_errors` (
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

CREATE TABLE IF NOT EXISTS `shared_assumptions` (
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

CREATE TABLE IF NOT EXISTS `shared_links` (
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
