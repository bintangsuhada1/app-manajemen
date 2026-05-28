INSERT INTO `Company` (`id`, `name`, `code`, `type`, `createdAt`, `updatedAt`)
VALUES
  ('jurti', 'PT Jurti Agung Mulia', 'JURTI', 'Kontraktor Kelistrikan', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('sip', 'PT SIP', 'SIP', 'SLO / NIDI', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('intek', 'PT Intek', 'INTEK', 'SLO / NIDI', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('panglima-bulang', 'Mangrove Panglima Bulang', 'PANGLIMA-BULANG', 'Restoran / Wisata Kuliner', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `updatedAt` = CURRENT_TIMESTAMP(3);
