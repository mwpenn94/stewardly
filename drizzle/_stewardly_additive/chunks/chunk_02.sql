CREATE TABLE IF NOT EXISTS `business_plans` (
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

CREATE TABLE IF NOT EXISTS `cadence_compliance_audit` (
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

CREATE TABLE IF NOT EXISTS `cadence_enrollments` (
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

CREATE TABLE IF NOT EXISTS `cadence_opt_out_registry` (
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

CREATE TABLE IF NOT EXISTS `cadence_touch_log` (
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

CREATE TABLE IF NOT EXISTS `calculator_result_cache` (
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

CREATE TABLE IF NOT EXISTS `calculator_scenarios` (
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

CREATE TABLE IF NOT EXISTS `capability_modes` (
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

CREATE TABLE IF NOT EXISTS `card_reviews` (
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

CREATE TABLE IF NOT EXISTS `card_schedules` (
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

CREATE TABLE IF NOT EXISTS `carrier_connections` (
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

CREATE TABLE IF NOT EXISTS `carrier_import_templates` (
	`id` varchar(36) NOT NULL,
	`carrier_slug` varchar(50) NOT NULL,
	`report_type` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`column_mappings` json NOT NULL,
	`parser_type` enum('csv','pdf_table','pdf_ocr','excel') NOT NULL,
	`sample_headers` json,
	`is_system` boolean DEFAULT false,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `carrier_import_templates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `carrier_submissions` (
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

CREATE TABLE IF NOT EXISTS `ce_credits` (
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

CREATE TABLE IF NOT EXISTS `chapter_prerequisites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapter_id` int NOT NULL,
	`prerequisite_chapter_id` int NOT NULL,
	`min_mastery_score` float NOT NULL DEFAULT 0.7,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chapter_prerequisites_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_cp_unique` UNIQUE(`chapter_id`,`prerequisite_chapter_id`)
);

CREATE TABLE IF NOT EXISTS `client_associations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`professionalId` int NOT NULL,
	`organizationId` int,
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_associations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `client_discovery` (
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

CREATE TABLE IF NOT EXISTS `client_goals` (
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

CREATE TABLE IF NOT EXISTS `client_plan_outcomes` (
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

CREATE TABLE IF NOT EXISTS `client_segments` (
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

CREATE TABLE IF NOT EXISTS `coa_actuals` (
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

CREATE TABLE IF NOT EXISTS `coa_campaigns` (
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

CREATE TABLE IF NOT EXISTS `coaching_messages` (
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

CREATE TABLE IF NOT EXISTS `coi_contacts` (
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

CREATE TABLE IF NOT EXISTS `coi_disclosures` (
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

CREATE TABLE IF NOT EXISTS `coi_verification_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coi_contact_id` int,
	`professional_id` int,
	`badge_type` enum('license_active','cfp_certified','cpa_active','bar_good_standing','nmls_authorized','nipr_licensed','cbi_certified','no_disclosures','fiduciary','am_best_rated','peer_rated') NOT NULL,
	`badge_label` varchar(100),
	`badge_data` json,
	`confidence_score` decimal(3,2),
	`source_verification_id` int,
	`granted_at` bigint NOT NULL,
	`expires_at` bigint,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coi_verification_badges_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `comms_log` (
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

CREATE TABLE IF NOT EXISTS `communication_archive` (
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

CREATE TABLE IF NOT EXISTS `community_posts` (
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

CREATE TABLE IF NOT EXISTS `community_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`author_id` int NOT NULL,
	`content` text,
	`likes_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `community_replies_id` PRIMARY KEY(`id`)
);
