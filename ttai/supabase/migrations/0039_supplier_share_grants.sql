-- Mother-supplier sharing: a source supplier (or TTAIEMA) grants another supplier
-- permission to import its catalogue. The importer copies products into its own
-- profile while provenance (imported_from_product_id, original_supplier_id, …)
-- keeps the whole chain connected.
create table if not exists supplier_share_grants (
  id                 uuid primary key default gen_random_uuid(),
  source_supplier_id uuid not null references suppliers(id) on delete cascade,
  target_supplier_id uuid not null references suppliers(id) on delete cascade,
  status             text not null default 'active' check (status in ('active', 'revoked')),
  created_at         timestamptz not null default now(),
  unique (source_supplier_id, target_supplier_id)
);

create index if not exists idx_share_target on supplier_share_grants (target_supplier_id, status);
create index if not exists idx_share_source on supplier_share_grants (source_supplier_id, status);
