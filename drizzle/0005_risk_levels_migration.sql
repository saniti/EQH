-- Update existing risk level values to new format
UPDATE `sessions` SET `injuryRisk` = 'Low' WHERE `injuryRisk` = 'low';
UPDATE `sessions` SET `injuryRisk` = 'Medium' WHERE `injuryRisk` = 'medium';
UPDATE `sessions` SET `injuryRisk` = 'High' WHERE `injuryRisk` = 'high';
UPDATE `sessions` SET `injuryRisk` = 'Extreme' WHERE `injuryRisk` = 'critical';
UPDATE `sessions` SET `injuryRisk` = 'Na' WHERE `injuryRisk` IS NULL OR `injuryRisk` = '';

-- Modify the enum column
ALTER TABLE `sessions` MODIFY COLUMN `injuryRisk` enum('Extreme','High','Medium','Low','Na') DEFAULT 'Na';

-- Add pictureData column to horses if it doesn't exist
ALTER TABLE `horses` ADD COLUMN `pictureData` longtext;

-- Create riskLevels table
CREATE TABLE IF NOT EXISTS `riskLevels` (
`id` int AUTO_INCREMENT NOT NULL,
`name` enum('Extreme','High','Medium','Low','Na') NOT NULL,
`color` varchar(50) NOT NULL,
`description` text,
`createdAt` timestamp DEFAULT (now()),
CONSTRAINT `riskLevels_id` PRIMARY KEY(`id`),
CONSTRAINT `riskLevels_name_unique` UNIQUE(`name`)
);
