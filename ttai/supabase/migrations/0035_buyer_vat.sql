-- Buyer VAT number + tax country, stored on the profile and auto-used at checkout
-- for EU B2B (intra-community) reverse-charge handling.
alter table profiles
  add column if not exists vat_number  text,
  add column if not exists tax_country char(2);
