CREATE TABLE IF NOT EXISTS `premium_finance_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rate_date` date NOT NULL,
	`sofr` decimal(6,4),
	`sofr_30` decimal(6,4),
	`sofr_90` decimal(6,4),
	`treasury_10y` decimal(6,4),
	`treasury_30y` decimal(6,4),
	`prime_rate` decimal(6,4),
	`fetched_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premium_finance_rates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `privacy_audit` (
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

CREATE TABLE IF NOT EXISTS `privacy_consent_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`advisor_id` int,
	`consent_type` varchar(50),
	`granted` boolean DEFAULT false,
	`details` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `privacy_consent_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `proactive_escalation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger_type` varchar(128) NOT NULL,
	`condition_text` text,
	`threshold` float,
	`active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proactive_escalation_rules_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `proactive_insights` (
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

CREATE TABLE IF NOT EXISTS `probe_results` (
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

CREATE TABLE IF NOT EXISTS `product_suitability_evaluations` (
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

CREATE TABLE IF NOT EXISTS `production_actuals` (
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

CREATE TABLE IF NOT EXISTS `products` (
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

CREATE TABLE IF NOT EXISTS `professional_ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`organizationId` int,
	`managerId` int,
	`specialization` varchar(256),
	`methodology` text,
	`communicationStyle` text,
	`perClientOverrides` json,
	`promptOverlay` text,
	`toneStyle` varchar(64),
	`responseFormat` varchar(64),
	`responseLength` varchar(64),
	`modelPreferences` json,
	`ensembleWeights` json,
	`temperature` float,
	`maxTokens` int,
	`defaultTtsVoice` varchar(64),
	`defaultSpeechRate` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professional_ai_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `professional_ai_settings_professionalId_unique` UNIQUE(`professionalId`)
);

CREATE TABLE IF NOT EXISTS `professional_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` varchar(8) NOT NULL,
	`end_time` varchar(8) NOT NULL,
	`timezone` varchar(64) DEFAULT 'America/New_York',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professional_availability_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `professional_context` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`addedBy` int NOT NULL,
	`rawInput` text NOT NULL,
	`parsedDomains` json,
	`visibleToClient` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professional_context_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `professional_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`document_type` varchar(100),
	`file_url` varchar(500),
	`uploaded_at` timestamp DEFAULT (now()),
	`verified` boolean DEFAULT false,
	CONSTRAINT `professional_documents_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `professional_relationships` (
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

CREATE TABLE IF NOT EXISTS `professional_reviews` (
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

CREATE TABLE IF NOT EXISTS `professional_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professional_id` int NOT NULL,
	`verification_source` enum('finra_brokercheck','sec_iapd','cfp_board','nasba_cpaverify','nipr_pdb','nmls','state_bar','ibba','martindale','avvo') NOT NULL,
	`verification_status` enum('verified','not_found','flagged','expired','pending') NOT NULL,
	`external_id` varchar(100),
	`external_url` varchar(500),
	`raw_data` json,
	`disclosures` json,
	`license_states` json,
	`license_expiration` timestamp,
	`verified_at` bigint NOT NULL,
	`expires_at` bigint,
	`verification_method` enum('api','scrape','manual','n8n_workflow') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professional_verifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `professionals` (
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

CREATE TABLE IF NOT EXISTS `prompt_experiment_results` (
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

CREATE TABLE IF NOT EXISTS `prompt_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variantId` int NOT NULL,
	`conversationId` int NOT NULL,
	`messageId` int,
	`feedbackRating` enum('up','down'),
	`confidenceScore` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_experiments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `prompt_golden_tests` (
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

CREATE TABLE IF NOT EXISTS `prompt_interactions` (
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

CREATE TABLE IF NOT EXISTS `prompt_regression_runs` (
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

CREATE TABLE IF NOT EXISTS `prompt_variants` (
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

CREATE TABLE IF NOT EXISTS `propagation_actions` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`actor_id` int NOT NULL,
	`action_type` enum('acknowledge','act','dismiss','escalate','snooze','delegate') NOT NULL,
	`notes` text,
	`result_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propagation_actions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `propagation_events` (
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

CREATE TABLE IF NOT EXISTS `propensity_bias_audits` (
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

CREATE TABLE IF NOT EXISTS `propensity_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feature_name` varchar(200) NOT NULL,
	`feature_source` varchar(100),
	`data_type` enum('numeric','categorical','boolean') NOT NULL,
	`description` text,
	`importance_rank` int,
	CONSTRAINT `propensity_features_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `propensity_models` (
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

CREATE TABLE IF NOT EXISTS `propensity_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` int NOT NULL,
	`model_id` int NOT NULL,
	`score` decimal(5,4) NOT NULL,
	`features_used` json,
	`scored_at` timestamp DEFAULT (now()),
	CONSTRAINT `propensity_scores_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `provider_health_checks` (
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
