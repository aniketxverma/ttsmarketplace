-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ── 1. Conversations ───────────────────────────────────────────────────────
create table if not exists conversations (
  id              uuid        primary key default gen_random_uuid(),
  buyer_id        uuid        not null references profiles(id)  on delete cascade,
  supplier_id     uuid        not null references suppliers(id) on delete cascade,
  order_id        uuid                 references orders(id)    on delete set null,
  subject         text,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- One thread per buyer-supplier pair per order (NULL order = general thread)
create unique index if not exists idx_conv_unique
  on conversations (buyer_id, supplier_id, coalesce(order_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ── 2. Messages ────────────────────────────────────────────────────────────
create table if not exists messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       uuid        not null references profiles(id)      on delete cascade,
  body            text        not null check (length(trim(body)) > 0),
  is_read         boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- ── 3. Indexes ─────────────────────────────────────────────────────────────
create index if not exists idx_messages_conv    on messages(conversation_id, created_at);
create index if not exists idx_conv_buyer       on conversations(buyer_id,    last_message_at desc);
create index if not exists idx_conv_supplier    on conversations(supplier_id, last_message_at desc);

-- ── 4. Realtime ────────────────────────────────────────────────────────────
-- Enables live message delivery in the chat UI
alter publication supabase_realtime add table messages;

-- ── 5. Row Level Security ──────────────────────────────────────────────────
alter table conversations enable row level security;
alter table messages       enable row level security;

-- Buyers can see and write to their own conversations
create policy "buyer_access_conversations"
  on conversations for all
  using  (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- Supplier owners can see and write to their supplier's conversations
create policy "supplier_access_conversations"
  on conversations for all
  using (
    exists (
      select 1 from suppliers s
      where s.id = conversations.supplier_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from suppliers s
      where s.id = conversations.supplier_id
        and s.owner_id = auth.uid()
    )
  );

-- Messages are accessible to both parties of the conversation
create policy "participant_access_messages"
  on messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (
          c.buyer_id = auth.uid()
          or exists (
            select 1 from suppliers s
            where s.id = c.supplier_id and s.owner_id = auth.uid()
          )
        )
    )
  )
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (
          c.buyer_id = auth.uid()
          or exists (
            select 1 from suppliers s
            where s.id = c.supplier_id and s.owner_id = auth.uid()
          )
        )
    )
  );
