CREATE TABLE `hub_item_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hub_item_id` int NOT NULL,
	`hub_history_action` enum('create','update','delete','rollback','publish','adopt') NOT NULL,
	`hub_history_scope` enum('platform','organization','professional','client') NOT NULL,
	`scope_ref_id` int,
	`actor_id` int NOT NULL,
	`on_behalf_of_id` int,
	`previous_data` json,
	`new_data` json,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hub_item_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `hub_history_item_idx` ON `hub_item_history` (`hub_item_id`);--> statement-breakpoint
CREATE INDEX `hub_history_actor_idx` ON `hub_item_history` (`actor_id`);--> statement-breakpoint
CREATE INDEX `hub_history_on_behalf_idx` ON `hub_item_history` (`on_behalf_of_id`);--> statement-breakpoint
CREATE INDEX `hub_history_scope_idx` ON `hub_item_history` (`hub_history_scope`,`scope_ref_id`);--> statement-breakpoint
CREATE INDEX `hub_history_created_idx` ON `hub_item_history` (`created_at`);