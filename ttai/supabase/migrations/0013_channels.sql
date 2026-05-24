-- 0013_channels.sql
-- Supplier broadcast channels ("Canales")
-- propietario = TTAI platform · admin = supplier · members = buyers / clients

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS supplier_channels (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  whatsapp     TEXT,
  invite_code  TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  member_count INT         NOT NULL DEFAULT 0,
  post_count   INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supplier_id)           -- one canal per supplier
);

CREATE TABLE IF NOT EXISTS channel_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID        NOT NULL REFERENCES supplier_channels(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS channel_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID        NOT NULL REFERENCES supplier_channels(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  image_url  TEXT,
  post_type  TEXT        NOT NULL DEFAULT 'update'
             CHECK (post_type IN ('update', 'offer', 'product', 'announcement')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Triggers — keep member_count / post_count in sync ────────────────────────

CREATE OR REPLACE FUNCTION sync_channel_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE supplier_channels
      SET member_count = member_count + 1, updated_at = now()
      WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE supplier_channels
      SET member_count = GREATEST(member_count - 1, 0), updated_at = now()
      WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_channel_member_count
  AFTER INSERT OR DELETE ON channel_members
  FOR EACH ROW EXECUTE FUNCTION sync_channel_member_count();

CREATE OR REPLACE FUNCTION sync_channel_post_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE supplier_channels
      SET post_count = post_count + 1, updated_at = now()
      WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE supplier_channels
      SET post_count = GREATEST(post_count - 1, 0), updated_at = now()
      WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_channel_post_count
  AFTER INSERT OR DELETE ON channel_posts
  FOR EACH ROW EXECUTE FUNCTION sync_channel_post_count();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE supplier_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_posts     ENABLE ROW LEVEL SECURITY;

-- supplier_channels
--   anyone can read active channels
--   supplier can create/update their own (TTAI admin manages is_active)
CREATE POLICY "sc_public_select"   ON supplier_channels
  FOR SELECT USING (is_active = true);

CREATE POLICY "sc_supplier_insert" ON supplier_channels
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "sc_supplier_update" ON supplier_channels
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

-- channel_members
--   any authenticated user can read (for membership checks)
--   users can only manage their own row
CREATE POLICY "cm_auth_select" ON channel_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cm_self_insert" ON channel_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cm_self_delete" ON channel_members
  FOR DELETE USING (user_id = auth.uid());

-- channel_posts
--   anyone can read posts from active channels
--   only the channel's supplier can create / delete posts
CREATE POLICY "cp_active_select" ON channel_posts
  FOR SELECT USING (
    channel_id IN (SELECT id FROM supplier_channels WHERE is_active = true)
  );

CREATE POLICY "cp_supplier_insert" ON channel_posts
  FOR INSERT WITH CHECK (
    channel_id IN (
      SELECT sc.id FROM supplier_channels sc
      JOIN suppliers s ON s.id = sc.supplier_id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY "cp_supplier_delete" ON channel_posts
  FOR DELETE USING (
    channel_id IN (
      SELECT sc.id FROM supplier_channels sc
      JOIN suppliers s ON s.id = sc.supplier_id
      WHERE s.owner_id = auth.uid()
    )
  );
