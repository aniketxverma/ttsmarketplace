-- ─────────────────────────────────────────────────────────────────────────────
-- B2B "Want to Buy" — purchase requests. For fast-moving B2B stock the buyer does
-- NOT pay immediately. They request → the supplier confirms stock, quantity, final
-- price and delivery time → only then the buyer pays. Protects both sides.
-- (Online-shop suppliers like Rozil/Café/Bullz still use add-to-cart + pay now.)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists purchase_requests (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid references profiles(id) on delete set null,
  supplier_id   uuid not null references suppliers(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  product_name  text,
  unit          text,                       -- unit | box | pallet | kg | container | truck
  quantity      text,                       -- requested quantity (free text)
  message       text,
  -- buyer contact (so the supplier can reply even before account linking)
  buyer_name    text, buyer_email text, buyer_company text, buyer_phone text,
  status        text not null default 'requested'
                  check (status in ('requested','confirmed','declined','paid','cancelled')),
  -- supplier confirmation
  confirmed_qty       text,
  confirmed_price_cents bigint,
  currency_code       text default 'EUR',
  delivery_time       text,
  supplier_note       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_pr_supplier on purchase_requests(supplier_id, created_at desc);
create index if not exists idx_pr_buyer    on purchase_requests(buyer_id, created_at desc);

create or replace function purchase_requests_touch() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_pr_touch on purchase_requests;
create trigger trg_pr_touch before update on purchase_requests for each row execute function purchase_requests_touch();

alter table purchase_requests enable row level security;

-- Buyer sees their own; supplier sees requests for their supplier(s); admin all.
drop policy if exists "pr_buyer_read" on purchase_requests;
create policy "pr_buyer_read" on purchase_requests for select
  using (buyer_id = auth.uid()
      or supplier_id in (select id from suppliers where owner_id = auth.uid())
      or current_user_role() = 'admin');

drop policy if exists "pr_buyer_insert" on purchase_requests;
create policy "pr_buyer_insert" on purchase_requests for insert
  with check (buyer_id = auth.uid() or buyer_id is null);

drop policy if exists "pr_update" on purchase_requests;
create policy "pr_update" on purchase_requests for update
  using (buyer_id = auth.uid()
      or supplier_id in (select id from suppliers where owner_id = auth.uid())
      or current_user_role() = 'admin');
