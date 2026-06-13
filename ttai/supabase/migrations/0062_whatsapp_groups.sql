-- 0062_whatsapp_groups.sql
-- WhatsApp Groups directory — suppliers list their public WhatsApp group invite
-- links so buyers browsing the marketplace can join groups where offers are passed.
-- Mirrors supplier_channels but for *group* invite links (not broadcast posts).

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  category     TEXT,
  invite_link  TEXT        NOT NULL,           -- https://chat.whatsapp.com/...
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  member_count INT         NOT NULL DEFAULT 0, -- optional, supplier-stated
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_supplier ON whatsapp_groups(supplier_id);

ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can read active groups (public directory).
CREATE POLICY "wg_public_select" ON whatsapp_groups
  FOR SELECT USING (is_active = true);

-- A supplier manages only their own groups.
CREATE POLICY "wg_supplier_insert" ON whatsapp_groups
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "wg_supplier_update" ON whatsapp_groups
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "wg_supplier_delete" ON whatsapp_groups
  FOR DELETE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );
