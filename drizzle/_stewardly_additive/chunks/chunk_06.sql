CREATE TABLE IF NOT EXISTS `improvement_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action_id` int NOT NULL,
	`user_id` int NOT NULL,
	`rating` int NOT NULL,
	`helpful` boolean DEFAULT true,
	`notes` text,
	`created_at` bigint NOT NULL,
	CONSTRAINT `improvement_feedback_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `improvement_hypotheses` (
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

CREATE TABLE IF NOT EXISTS `improvement_signals` (
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

CREATE TABLE IF NOT EXISTS `industry_benchmarks` (
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

CREATE TABLE IF NOT EXISTS `ingested_records` (
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

CREATE TABLE IF NOT EXISTS `ingestion_insights` (
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

CREATE TABLE IF NOT EXISTS `ingestion_jobs` (
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

CREATE TABLE IF NOT EXISTS `insight_actions` (
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

CREATE TABLE IF NOT EXISTS `insurance_applications` (
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

CREATE TABLE IF NOT EXISTS `insurance_carriers` (
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

CREATE TABLE IF NOT EXISTS `insurance_products` (
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

CREATE TABLE IF NOT EXISTS `insurance_quotes` (
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

CREATE TABLE IF NOT EXISTS `integration_analysis_log` (
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

CREATE TABLE IF NOT EXISTS `integration_blueprint_runs` (
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

CREATE TABLE IF NOT EXISTS `integration_blueprint_samples` (
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

CREATE TABLE IF NOT EXISTS `integration_blueprint_versions` (
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

CREATE TABLE IF NOT EXISTS `integration_blueprints` (
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

CREATE TABLE IF NOT EXISTS `integration_connections` (
	`id` varchar(36) NOT NULL,
	`provider_id` varchar(36) NOT NULL,
	`ownership_tier` enum('platform','organization','professional','client') NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`organization_id` int,
	`user_id` int,
	`status` enum('connected','disconnected','error','pending','expired') DEFAULT 'pending',
	`credentials_encrypted` text,
	`config_json` json,
	`last_sync_at` timestamp,
	`last_sync_status` enum('success','partial','failed'),
	`last_sync_error` text,
	`records_synced` int DEFAULT 0,
	`usage_this_period` int DEFAULT 0,
	`usage_period_start` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_connections_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `integration_field_mappings` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`external_field` varchar(200) NOT NULL,
	`internal_table` varchar(100) NOT NULL,
	`internal_field` varchar(200) NOT NULL,
	`transform` enum('direct','lowercase','uppercase','date_parse','phone_e164','currency_cents','boolean_parse','custom') DEFAULT 'direct',
	`custom_transform` text,
	`is_active` boolean DEFAULT true,
	CONSTRAINT `integration_field_mappings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `integration_health_checks` (
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

CREATE TABLE IF NOT EXISTS `integration_health_summary` (
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

CREATE TABLE IF NOT EXISTS `integration_improvement_log` (
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

CREATE TABLE IF NOT EXISTS `integration_optimization_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycle_type` varchar(100),
	`started_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	`improvements` json,
	`score_before` decimal(5,2),
	`score_after` decimal(5,2),
	CONSTRAINT `integration_optimization_cycles_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `integration_providers` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('crm','messaging','carrier','investments','insurance','demographics','economic','enrichment','regulatory','property','middleware','marketing','recruiting','government') NOT NULL,
	`ownership_tier` enum('platform','organization','professional','client') NOT NULL,
	`auth_method` enum('oauth2','api_key','bearer_token','hmac_webhook','manual_upload','none') NOT NULL,
	`base_url` varchar(500),
	`docs_url` varchar(500),
	`signup_url` varchar(500),
	`free_tier_description` text,
	`free_tier_limit` varchar(200),
	`logo_url` varchar(500),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_providers_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `integration_sync_config` (
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

CREATE TABLE IF NOT EXISTS `integration_sync_logs` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`sync_type` enum('full','incremental','webhook','manual_upload','on_demand') NOT NULL,
	`direction` enum('inbound','outbound','bidirectional') NOT NULL,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`status` enum('running','success','partial','failed','cancelled') NOT NULL,
	`records_created` int DEFAULT 0,
	`records_updated` int DEFAULT 0,
	`records_failed` int DEFAULT 0,
	`error_details` json,
	`triggered_by` enum('schedule','webhook','manual','system') NOT NULL,
	`triggered_by_user_id` int,
	CONSTRAINT `integration_sync_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `integration_webhook_events` (
	`id` varchar(36) NOT NULL,
	`connection_id` varchar(36) NOT NULL,
	`provider_slug` varchar(50) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`payload_json` json NOT NULL,
	`signature_valid` boolean NOT NULL,
	`processed_at` timestamp,
	`processing_status` enum('pending','processed','failed','skipped') DEFAULT 'pending',
	`processing_error` text,
	`received_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_webhook_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `iul_crediting_history` (
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

CREATE TABLE IF NOT EXISTS `kb_access_transitions` (
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

CREATE TABLE IF NOT EXISTS `kb_sharing_defaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationship_type` enum('financial_advisor','insurance_agent','tax_professional','estate_attorney','accountant','mortgage_broker','real_estate_agent','other') NOT NULL,
	`topic` enum('insurance','investments','tax','estate','retirement','debt','budgeting','real_estate','business','education','health_finance','general','all') NOT NULL,
	`default_access_level` enum('none','summary','read','contribute','full') NOT NULL DEFAULT 'read',
	`rationale` text,
	CONSTRAINT `kb_sharing_defaults_id` PRIMARY KEY(`id`)
);
