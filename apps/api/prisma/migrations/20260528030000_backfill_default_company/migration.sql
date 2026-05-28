INSERT INTO `Company` (`id`, `name`, `code`, `type`, `createdAt`, `updatedAt`)
VALUES ('jurti', 'PT Jurti Agung Mulia', 'JURTI', 'Kontraktor Kelistrikan', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

UPDATE `Customer` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Project` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Quote` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Invoice` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Transaction` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Material` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `DailyReport` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `MaterialMovement` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Supplier` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
UPDATE `Document` SET `companyId` = 'jurti' WHERE `companyId` IS NULL;
