CREATE TABLE `apiSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchSize` int DEFAULT 100,
	`delayMs` int DEFAULT 1000,
	`retryAttempts` int DEFAULT 3,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(64),
	CONSTRAINT `apiSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serialNumber` varchar(100) NOT NULL,
	`organizationId` int NOT NULL,
	`horseId` int,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_serialNumber_unique` UNIQUE(`serialNumber`)
);
--> statement-breakpoint
CREATE TABLE `horses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`breed` varchar(100),
	`status` enum('active','injured','retired','inactive') NOT NULL DEFAULT 'active',
	`organizationId` int NOT NULL,
	`deviceId` int,
	`healthRecords` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `injuryRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`affectedParts` json NOT NULL,
	`status` enum('flagged','dismissed','diagnosed') NOT NULL DEFAULT 'flagged',
	`notes` text,
	`medicalDiagnosis` text,
	`veterinarianId` varchar(64),
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `injuryRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`userType` enum('standard','veterinarian') NOT NULL DEFAULT 'standard',
	`organizationId` int NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`token` varchar(255) NOT NULL,
	`expiresAt` datetime NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`acceptedAt` datetime,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `organizationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`requestType` enum('create','transfer') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`details` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactInfo` json,
	`ownerId` varchar(64) NOT NULL,
	`notificationSettings` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` varchar(64) NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `sessionComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`horseId` int NOT NULL,
	`trackId` int NOT NULL,
	`sessionDate` datetime NOT NULL,
	`performanceData` json,
	`injuryRisk` enum('low','medium','high','critical'),
	`recoveryTarget` datetime,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`trackId` int,
	`requestType` enum('create','modify','delete') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`details` json,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trackRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50),
	`scope` enum('global','local') NOT NULL DEFAULT 'local',
	`organizationId` int,
	`description` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upcomingCare` (
	`id` int AUTO_INCREMENT NOT NULL,
	`horseId` int NOT NULL,
	`organizationId` int NOT NULL,
	`careType` varchar(100) NOT NULL,
	`scheduledDate` datetime NOT NULL,
	`description` text,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upcomingCare_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userFavoriteHorses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`horseId` int NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `userFavoriteHorses_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_horse_idx` UNIQUE(`userId`,`horseId`)
);
--> statement-breakpoint
CREATE TABLE `userOrganizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`organizationId` int NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `userOrganizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_org_idx` UNIQUE(`userId`,`organizationId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('standard','veterinarian') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended','deactivated') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `theme` enum('light','dark','auto') DEFAULT 'auto';--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(50) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(10) DEFAULT 'en-US';