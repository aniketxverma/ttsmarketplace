-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp Channel link on a supplier's canal.
-- Separate from `whatsapp` (the direct-contact phone number): this is the
-- supplier's official WhatsApp Channel invite link (https://whatsapp.com/channel/…)
-- shown publicly so buyers can FOLLOW it for offers, stock updates & announcements.
-- ─────────────────────────────────────────────────────────────────────────────
alter table supplier_channels add column if not exists whatsapp_channel_url text;
