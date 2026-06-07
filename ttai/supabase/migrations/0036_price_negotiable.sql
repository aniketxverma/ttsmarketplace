-- Fixed vs Negotiable pricing.
--   false (default) = Fixed: the listed price is the final ("last") price.
--   true            = Negotiable: buyers can request a better price / make an offer.
alter table products
  add column if not exists price_negotiable boolean not null default false;
