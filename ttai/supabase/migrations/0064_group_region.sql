-- 0064_group_region.sql
-- Add an optional region to WhatsApp groups so the WhatsApp Hub can present
-- "Groups by Region" (Spain, Europe, Africa, Middle East, Latin America, Asia,
-- Global). Set by the supplier when they add their group.

ALTER TABLE whatsapp_groups
  ADD COLUMN IF NOT EXISTS region TEXT;
