-- Phase 4 — Business type on the shop itself, so the marketplace Shops tab and
-- profiles can show "Factory / Distributor / Retail Shop" etc. publicly.
-- business_type currently lives on profiles (owner) which is not publicly readable,
-- so we surface a copy on suppliers (publicly readable) and backfill it once.

alter table suppliers add column if not exists business_type text;

-- Backfill from the owner's profile where not already set.
update suppliers s
   set business_type = p.business_type
  from profiles p
 where p.id = s.owner_id
   and (s.business_type is null or s.business_type = '')
   and p.business_type is not null
   and p.business_type <> '';

-- Keep it in sync when a profile's business_type changes (and on supplier insert).
create or replace function sync_supplier_business_type() returns trigger as $$
begin
  -- when a profile changes, update that owner's suppliers
  if tg_table_name = 'profiles' then
    update suppliers set business_type = new.business_type where owner_id = new.id;
    return new;
  end if;
  -- when a supplier is created without a type, inherit the owner's
  if new.business_type is null or new.business_type = '' then
    select business_type into new.business_type from profiles where id = new.owner_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_profile_business_type on profiles;
create trigger trg_profile_business_type
  after update of business_type on profiles
  for each row execute function sync_supplier_business_type();

drop trigger if exists trg_supplier_business_type on suppliers;
create trigger trg_supplier_business_type
  before insert on suppliers
  for each row execute function sync_supplier_business_type();
