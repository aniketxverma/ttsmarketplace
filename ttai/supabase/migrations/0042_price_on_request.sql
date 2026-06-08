-- "Price on request" — B2B products with no public price; the buyer requests a
-- quote / negotiates. (Distinct from price_negotiable, which still shows a price.)
alter table products
  add column if not exists price_on_request boolean not null default false;
