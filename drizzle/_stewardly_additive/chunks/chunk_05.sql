CREATE TABLE IF NOT EXISTS `equity_grants` (
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

CREATE TABLE IF NOT EXISTS `escalation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`from_level` int NOT NULL,
	`to_level` int NOT NULL,
	`reason` text,
	`decided_by` varchar(50),
	`decided_at` timestamp DEFAULT (now()),
	CONSTRAINT `escalation_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `esignature_tracking` (
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

CREATE TABLE IF NOT EXISTS `estate_documents` (
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

CREATE TABLE IF NOT EXISTS `exchange_analyses` (
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

CREATE TABLE IF NOT EXISTS `export_jobs` (
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

CREATE TABLE IF NOT EXISTS `extraction_plan_jobs` (
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

CREATE TABLE IF NOT EXISTS `extraction_plans` (
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

CREATE TABLE IF NOT EXISTS `fairness_test_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demographic` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`prompt_text` text NOT NULL,
	`expected_behavior` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` bigint NOT NULL,
	CONSTRAINT `fairness_test_prompts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `fairness_test_results` (
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

CREATE TABLE IF NOT EXISTS `fairness_test_runs` (
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

CREATE TABLE IF NOT EXISTS `feature_flags` (
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

CREATE TABLE IF NOT EXISTS `feature_permissions` (
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

CREATE TABLE IF NOT EXISTS `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messageId` int NOT NULL,
	`conversationId` int NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `field_sharing_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`field_name` varchar(128) NOT NULL,
	`share_with_role` varchar(32),
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `field_sharing_controls_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `file_chunks` (
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

CREATE TABLE IF NOT EXISTS `file_derived_enrichments` (
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

CREATE TABLE IF NOT EXISTS `file_uploads` (
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

CREATE TABLE IF NOT EXISTS `financial_profiles` (
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

CREATE TABLE IF NOT EXISTS `financial_protection_scores` (
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

CREATE TABLE IF NOT EXISTS `gate_reviews` (
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

CREATE TABLE IF NOT EXISTS `generated_documents` (
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

CREATE TABLE IF NOT EXISTS `ghl_locations` (
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

CREATE TABLE IF NOT EXISTS `glossary_terms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term` varchar(200) NOT NULL,
	`slug` varchar(200),
	`definition` text,
	`glossary_category` enum('insurance','retirement','estate','tax','investment','business','general') DEFAULT 'general',
	`related_calculator` varchar(100),
	CONSTRAINT `glossary_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `glossary_terms_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `health_scores` (
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

CREATE TABLE IF NOT EXISTS `hnw_narrative_scores` (
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

CREATE TABLE IF NOT EXISTS `hypothesis_test_results` (
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

CREATE TABLE IF NOT EXISTS `import_field_mappings` (
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

CREATE TABLE IF NOT EXISTS `import_jobs` (
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

CREATE TABLE IF NOT EXISTS `improvement_actions` (
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
