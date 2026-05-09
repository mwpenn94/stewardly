CREATE TABLE IF NOT EXISTS `kb_sharing_permissions` (
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

CREATE TABLE IF NOT EXISTS `kg_edges` (
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

CREATE TABLE IF NOT EXISTS `kg_nodes` (
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

CREATE TABLE IF NOT EXISTS `knowledge_article_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`user_id` int,
	`helpful` boolean NOT NULL,
	`feedback_text` text,
	`context` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_article_feedback_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `knowledge_article_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`version` int NOT NULL,
	`content` text NOT NULL,
	`changed_by` int,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	`change_reason` text,
	CONSTRAINT `knowledge_article_versions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `knowledge_articles` (
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

CREATE TABLE IF NOT EXISTS `knowledge_gap_feedback` (
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

CREATE TABLE IF NOT EXISTS `knowledge_gaps` (
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

CREATE TABLE IF NOT EXISTS `knowledge_graph_edges` (
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

CREATE TABLE IF NOT EXISTS `knowledge_graph_entities` (
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

CREATE TABLE IF NOT EXISTS `knowledge_ingestion_jobs` (
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

CREATE TABLE IF NOT EXISTS `layer_audits` (
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

CREATE TABLE IF NOT EXISTS `layer_metrics` (
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

CREATE TABLE IF NOT EXISTS `lead_capture_config` (
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

CREATE TABLE IF NOT EXISTS `lead_pipeline` (
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

CREATE TABLE IF NOT EXISTS `lead_profile_accumulator` (
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

CREATE TABLE IF NOT EXISTS `lead_source_performance` (
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

CREATE TABLE IF NOT EXISTS `lead_sources` (
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

CREATE TABLE IF NOT EXISTS `learning_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`achievement_key` varchar(128) NOT NULL,
	`unlocked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_achievements_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_ai_quiz_questions` (
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

CREATE TABLE IF NOT EXISTS `learning_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content_type` varchar(64) NOT NULL,
	`content_id` varchar(255) NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_bookmarks_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_cases` (
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

CREATE TABLE IF NOT EXISTS `learning_ce_credits` (
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

CREATE TABLE IF NOT EXISTS `learning_challenge_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challenge_id` int NOT NULL,
	`user_id` int NOT NULL,
	`score` decimal(5,2) DEFAULT '0',
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_challenge_results_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_chapters` (
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

CREATE TABLE IF NOT EXISTS `learning_connections` (
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

CREATE TABLE IF NOT EXISTS `learning_content_history` (
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

CREATE TABLE IF NOT EXISTS `learning_content_versions` (
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

CREATE TABLE IF NOT EXISTS `learning_definitions` (
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

CREATE TABLE IF NOT EXISTS `learning_disciplines` (
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
