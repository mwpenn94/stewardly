CREATE TABLE `hub_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_user_id` int NOT NULL,
	`hub_item_type` enum('app','artifact','file','folder') NOT NULL,
	`app_id` int,
	`builtin_id` varchar(96),
	`label` varchar(200) NOT NULL,
	`icon` varchar(256),
	`color` varchar(32),
	`parent_folder_id` int,
	`page_index` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	`pinned_to_dock` int NOT NULL DEFAULT 0,
	`hub_visibility` enum('private','org','unlisted','public') NOT NULL DEFAULT 'private',
	`organization_id` int,
	`hub_min_role` enum('user','professional','manager','org_admin'),
	`payload` json,
	`last_opened_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hub_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hub_share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`hub_item_id` int NOT NULL,
	`created_by_user_id` int NOT NULL,
	`expires_at` timestamp,
	`max_installs` int,
	`use_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hub_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `hub_share_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `hub_items_owner_idx` ON `hub_items` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `hub_items_parent_idx` ON `hub_items` (`parent_folder_id`);--> statement-breakpoint
CREATE INDEX `hub_items_type_idx` ON `hub_items` (`hub_item_type`);--> statement-breakpoint
CREATE INDEX `hub_items_visibility_idx` ON `hub_items` (`hub_visibility`);--> statement-breakpoint
CREATE INDEX `hub_items_org_idx` ON `hub_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `hub_items_page_idx` ON `hub_items` (`owner_user_id`,`page_index`,`sort_order`);--> statement-breakpoint
CREATE INDEX `hub_share_links_item_idx` ON `hub_share_links` (`hub_item_id`);