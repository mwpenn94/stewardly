CREATE TABLE `platform_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyPrefix` varchar(32) NOT NULL,
	`keyHash` varchar(128) NOT NULL,
	`label` varchar(256),
	`scopes` text,
	`issuedByUserId` int NOT NULL,
	`expiresAt` timestamp,
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_api_keys_keyPrefix_unique` UNIQUE(`keyPrefix`)
);
