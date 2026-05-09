CREATE TABLE IF NOT EXISTS `digital_asset_inventory` (
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

CREATE TABLE IF NOT EXISTS `disclaimer_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`disclaimer_id` int NOT NULL,
	`disclaimer_version` int DEFAULT 1,
	`shown_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_audit_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `disclaimer_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disclaimer_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` enum('shown','scrolled','clicked','acknowledged') DEFAULT 'shown',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_interactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `disclaimer_translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disclaimer_id` int NOT NULL,
	`language` varchar(10) NOT NULL,
	`translated_text` text NOT NULL,
	`verified_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_translations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `disclaimer_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(128) NOT NULL,
	`disclaimer_text` text NOT NULL,
	`version` int DEFAULT 1,
	`effective_date` timestamp NOT NULL DEFAULT (now()),
	`superseded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimer_versions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `document_annotations` (
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

CREATE TABLE IF NOT EXISTS `document_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`chunkIndex` int NOT NULL,
	`category` enum('personal_docs','financial_products','regulations','training_materials','artifacts','skills') NOT NULL DEFAULT 'personal_docs',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_chunks_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `document_extractions` (
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

CREATE TABLE IF NOT EXISTS `document_tag_map` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_tag_map_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `document_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(32) DEFAULT '#6366f1',
	`isAiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_tags_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `document_templates` (
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

CREATE TABLE IF NOT EXISTS `document_versions` (
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

CREATE TABLE IF NOT EXISTS `documents` (
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

CREATE TABLE IF NOT EXISTS `dripify_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(100),
	`payload` json,
	`processed` boolean DEFAULT false,
	`lead_pipeline_id` int,
	`received_at` timestamp DEFAULT (now()),
	`processed_at` timestamp,
	CONSTRAINT `dripify_webhook_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `economic_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(20) NOT NULL,
	`metric_name` varchar(50) NOT NULL,
	`value` varchar(20),
	`source` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economic_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `education_modules` (
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

CREATE TABLE IF NOT EXISTS `education_progress` (
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

CREATE TABLE IF NOT EXISTS `education_triggers` (
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

CREATE TABLE IF NOT EXISTS `email_campaigns` (
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

CREATE TABLE IF NOT EXISTS `email_sends` (
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

CREATE TABLE IF NOT EXISTS `embed_configurations` (
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

CREATE TABLE IF NOT EXISTS `encrypted_fields_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`table_name` varchar(128) NOT NULL,
	`column_name` varchar(128) NOT NULL,
	`encryption_method` varchar(64) DEFAULT 'AES-256-GCM',
	`key_alias` varchar(128) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encrypted_fields_registry_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `encryption_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key_alias` varchar(128) NOT NULL,
	`status` enum('active','rotating','retired') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`rotated_at` timestamp,
	`retired_at` timestamp,
	CONSTRAINT `encryption_keys_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `engagement_letters` (
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

CREATE TABLE IF NOT EXISTS `engagement_scores` (
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

CREATE TABLE IF NOT EXISTS `enrichment_cache` (
	`id` varchar(36) NOT NULL,
	`provider_slug` varchar(50) NOT NULL,
	`lookup_key` varchar(500) NOT NULL,
	`lookup_type` varchar(50) NOT NULL,
	`result_json` json NOT NULL,
	`quality_score` decimal(3,2),
	`fetched_at` timestamp NOT NULL,
	`expires_at` timestamp NOT NULL,
	`hit_count` int DEFAULT 1,
	`connection_id` varchar(36),
	CONSTRAINT `enrichment_cache_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `enrichment_cohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`matchCriteria` json NOT NULL,
	`enrichmentFields` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_cohorts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `enrichment_datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`applicableDomains` json,
	`dataType` varchar(64),
	`matchDimensions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_datasets_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `enrichment_matches` (
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

CREATE TABLE IF NOT EXISTS `entity_resolution_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern` varchar(512) NOT NULL,
	`canonical_entity_id` int NOT NULL,
	`confidence` float DEFAULT 0.9,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_resolution_rules_id` PRIMARY KEY(`id`)
);
