CREATE TABLE `engine_widget_layouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`engine_id` varchar(64) NOT NULL,
	`order` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engine_widget_layouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `engine_widget_layouts_user_engine_uniq` UNIQUE(`user_id`,`engine_id`)
);
