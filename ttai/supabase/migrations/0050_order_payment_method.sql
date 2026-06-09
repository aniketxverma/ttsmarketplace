-- Buyer-selected payment method on each order (card / bank transfer / cash on delivery).
alter table orders add column if not exists payment_method text;
