CREATE TABLE IF NOT EXISTS `learning_discovery_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`seed_query` text,
	`follow_ups` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_discovery_history_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_flashcards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`track_id` int,
	`chapter_id` int,
	`term` varchar(512) NOT NULL,
	`definition` text NOT NULL,
	`source_label` varchar(255),
	`created_by` int,
	`source` enum('manual','ai_generated','user_authored') NOT NULL DEFAULT 'manual',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_flashcards_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_formulas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discipline_id` int,
	`name` varchar(255) NOT NULL,
	`formula` text NOT NULL,
	`variables` json,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`source_ref` text,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_formulas_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_fs_applications` (
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
	CONSTRAINT `learning_fs_applications_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_group_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`detail` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_activity_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_group_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`target_date` timestamp,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `learning_group_goals_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_members_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_group_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_group_notes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`license_type` varchar(128) NOT NULL,
	`license_state` varchar(64),
	`license_number` varchar(128),
	`issue_date` date,
	`expiration_date` date,
	`status` enum('active','expired','pending','suspended') NOT NULL DEFAULT 'active',
	`ce_credits_required` int DEFAULT 0,
	`ce_credits_completed` int DEFAULT 0,
	`ce_deadline` date,
	`last_verified` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_licenses_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_mastery_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`item_key` varchar(255) NOT NULL,
	`item_type` varchar(64) NOT NULL,
	`seen` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`confidence` int NOT NULL DEFAULT 0,
	`review_count` int NOT NULL DEFAULT 0,
	`last_reviewed` timestamp,
	`next_due` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_mastery_progress_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_pending_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`permission` enum('view','edit') DEFAULT 'view',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_pending_invites_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_playlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`content_type` varchar(64) NOT NULL,
	`content_id` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `learning_playlist_items_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_playlist_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlist_id` int NOT NULL,
	`shared_with_user_id` int NOT NULL,
	`permission` enum('view','edit') DEFAULT 'view',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_playlist_shares_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`is_public` boolean NOT NULL DEFAULT false,
	`share_token` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_playlists_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_practice_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`track_id` int,
	`chapter_id` int,
	`prompt` text NOT NULL,
	`options` json,
	`correct_index` int,
	`explanation` text,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`tags` json,
	`created_by` int,
	`source` enum('manual','ai_generated','user_authored') NOT NULL DEFAULT 'manual',
	`status` enum('published','draft','review','retired') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_practice_questions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_quiz_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`shared_quiz_id` int,
	`title` varchar(255) NOT NULL,
	`time_limit_seconds` int,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_quiz_challenges_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_regulatory_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(128) NOT NULL,
	`category` varchar(128),
	`title` varchar(512) NOT NULL,
	`summary` text,
	`effective_date` date,
	`affected_licenses` json,
	`affected_content` json,
	`reg_status` enum('new','reviewed','applied','dismissed') NOT NULL DEFAULT 'new',
	`reviewed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_regulatory_updates_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`setting_key` varchar(128) NOT NULL,
	`setting_value` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_settings_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_shared_quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`question_ids` json,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_shared_quizzes_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_streak` int NOT NULL DEFAULT 0,
	`longest_streak` int NOT NULL DEFAULT 0,
	`last_activity_date` varchar(10),
	`daily_goal_minutes` int NOT NULL DEFAULT 15,
	`nudge_enabled` boolean NOT NULL DEFAULT false,
	`nudge_time` varchar(5),
	`total_days_active` int NOT NULL DEFAULT 0,
	`feature_flag` enum('control','treatment') NOT NULL DEFAULT 'treatment',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `learning_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_ls_user` UNIQUE(`user_id`)
);

CREATE TABLE IF NOT EXISTS `learning_study_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`invite_code` varchar(32) NOT NULL,
	`owner_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_study_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_study_groups_invite_code_unique` UNIQUE(`invite_code`)
);

CREATE TABLE IF NOT EXISTS `learning_study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`discipline` varchar(128),
	`track_key` varchar(128),
	`duration_minutes` int NOT NULL DEFAULT 0,
	`items_studied` int NOT NULL DEFAULT 0,
	`items_mastered` int NOT NULL DEFAULT 0,
	`quiz_score` decimal(5,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_study_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_subsections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapter_id` int NOT NULL,
	`title` varchar(512),
	`level` int NOT NULL DEFAULT 2,
	`paragraphs` json,
	`tables` json,
	`is_question` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` int,
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_subsections_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `learning_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('securities','planning','insurance','custom') NOT NULL DEFAULT 'custom',
	`title` varchar(512),
	`subtitle` text,
	`description` text,
	`color` varchar(32),
	`emoji` varchar(8),
	`tagline` text,
	`exam_overview` json,
	`created_by` int,
	`visibility` enum('public','team','private') NOT NULL DEFAULT 'public',
	`status` enum('published','draft','review','archived') NOT NULL DEFAULT 'published',
	`version` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_tracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_tracks_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `load_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_date` timestamp NOT NULL DEFAULT (now()),
	`scenario` varchar(256) NOT NULL,
	`concurrent_users` int,
	`requests_per_second` float,
	`p95_latency_ms` int,
	`errors` int DEFAULT 0,
	`notes` text,
	CONSTRAINT `load_test_results_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `location_alert_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location_db_id` int NOT NULL,
	`location_id` varchar(100) NOT NULL,
	`metric_name` varchar(64) NOT NULL,
	`warning_threshold` float NOT NULL,
	`critical_threshold` float NOT NULL,
	`enabled` boolean DEFAULT true,
	`last_notified_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `location_alert_thresholds_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ltc_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_age` int,
	`retirement_age` int DEFAULT 65,
	`state` varchar(2),
	`zip_code` varchar(10),
	`health_status` enum('excellent','good','fair','poor') DEFAULT 'good',
	`gender` enum('male','female','other'),
	`marital_status` enum('single','married','divorced','widowed'),
	`annual_income` decimal(15,2),
	`total_assets` decimal(15,2),
	`ltc_insurance_has` boolean DEFAULT false,
	`ltc_insurance_daily_benefit` decimal(10,2),
	`ltc_insurance_benefit_period` int,
	`projected_annual_cost` decimal(15,2),
	`projected_duration_years` decimal(5,2),
	`probability_of_need` decimal(5,2),
	`funding_gap` decimal(15,2),
	`recommended_strategy` varchar(50),
	`analysis_json` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ltc_analyses_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `manager_ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`organizationId` int,
	`teamFocusAreas` json,
	`clientSegmentTargeting` text,
	`reportingRequirements` json,
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
	CONSTRAINT `manager_ai_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `manager_ai_settings_managerId_unique` UNIQUE(`managerId`)
);

CREATE TABLE IF NOT EXISTS `market_data_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(50) NOT NULL,
	`dataType` enum('price','fx_rate','interest_rate','index','economic_indicator','commodity') NOT NULL,
	`value` decimal(18,6) NOT NULL,
	`currency` varchar(10) DEFAULT 'USD',
	`source` varchar(100),
	`observedAt` bigint NOT NULL,
	`metadataJson` json,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `market_data_cache_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `market_data_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`subscribed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_subscriptions_id` PRIMARY KEY(`id`)
);
