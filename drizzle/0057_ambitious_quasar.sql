ALTER TABLE `users` ADD `stripeSubscriptionStatus` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripePlanId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCurrentPeriodEnd` bigint;--> statement-breakpoint
ALTER TABLE `users` ADD `authTier` varchar(32) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `tosAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `settings` json;--> statement-breakpoint
ALTER TABLE `users` ADD `suitabilityCompleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `suitabilityData` json;--> statement-breakpoint
ALTER TABLE `users` ADD `styleProfile` json;--> statement-breakpoint
ALTER TABLE `users` ADD `anonymousConversationCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateOrgId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `employerName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `profileEnrichedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `profileEnrichmentSource` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `signInDataJson` json;--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `googlePhone` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `googleBirthday` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `googleGender` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `googleAddressJson` json;--> statement-breakpoint
ALTER TABLE `users` ADD `googleOrganizationsJson` json;--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinHeadline` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinIndustry` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinLocation` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinProfileUrl` varchar(512);