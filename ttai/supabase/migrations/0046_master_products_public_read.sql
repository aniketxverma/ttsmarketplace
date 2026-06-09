-- master_products is public, read-only catalog data (no user-scoped or sensitive
-- fields). RLS was effectively blocking anon/auth reads, which 404'd the public
-- master product page (/p/[id]). Allow everyone to read; writes stay service-role.
alter table master_products enable row level security;

drop policy if exists "master_products public read" on master_products;
create policy "master_products public read"
  on master_products for select
  using (true);

-- Ensure the API roles can select (RLS still applies on top of the grant).
grant select on master_products to anon, authenticated;
