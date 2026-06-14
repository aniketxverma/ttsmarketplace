-- 0065_card_template.sql
-- Supplier's chosen default style for their digital business card
-- (navy | gold | mint | plat). The card auto-fills from the profile; this only
-- sets which template it opens in.

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS card_template TEXT;
