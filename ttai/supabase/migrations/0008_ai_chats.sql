-- ── ai_chats — stores all AI assistant conversations ─────────────────────────
-- session_key groups messages from the same browser session (anon or logged-in)

CREATE TABLE IF NOT EXISTS ai_chats (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT        NOT NULL,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  products    JSONB       DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chats_session ON ai_chats(session_key, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user    ON ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_time    ON ai_chats(created_at DESC);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- Anyone (anon/auth) can insert — API uses service role anyway
CREATE POLICY "ai_chats insert"
  ON ai_chats FOR INSERT WITH CHECK (true);

-- Logged-in users can read their own sessions
CREATE POLICY "ai_chats read own"
  ON ai_chats FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "ai_chats admin read"
  ON ai_chats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
