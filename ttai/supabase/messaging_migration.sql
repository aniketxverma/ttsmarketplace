-- Run this in your Supabase SQL editor

-- Conversations: one per buyer–supplier pair (optionally tied to an order)
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null references profiles(id) on delete cascade,
  supplier_id     uuid not null references suppliers(id) on delete cascade,
  order_id        uuid references orders(id) on delete set null,
  subject         text,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique nulls not distinct (buyer_id, supplier_id, order_id)
);

-- Messages within a conversation
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null check (length(trim(body)) > 0),
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Indexes for fast lookup
create index if not exists idx_messages_conv      on messages(conversation_id, created_at);
create index if not exists idx_conv_buyer         on conversations(buyer_id, last_message_at desc);
create index if not exists idx_conv_supplier      on conversations(supplier_id, last_message_at desc);

-- Enable Supabase Realtime on messages (run separately if needed)
-- alter publication supabase_realtime add table messages;

-- RLS
alter table conversations enable row level security;
alter table messages       enable row level security;

-- Buyers see their own conversations
create policy "buyer_access_conversations"
  on conversations for all
  using (buyer_id = auth.uid());

-- Supplier owners see conversations for their supplier
create policy "supplier_access_conversations"
  on conversations for all
  using (
    exists (
      select 1 from suppliers s
      where s.id = conversations.supplier_id
        and s.owner_id = auth.uid()
    )
  );

-- Participants see messages in their conversations
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
  );
