CREATE TABLE IF NOT EXISTS `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`status` enum('idle','running','completed','error') NOT NULL DEFAULT 'idle',
	`workspaceUrl` text,
	`currentStep` varchar(500),
	`totalSteps` int,
	`completedSteps` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_externalId_unique` UNIQUE(`externalId`)
);

CREATE TABLE IF NOT EXISTS `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`generalSettings` json,
	`capabilities` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
