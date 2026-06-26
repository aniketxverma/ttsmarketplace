-- Store the rendered HTML body of each sent email so the admin Email Center can
-- preview exactly what was delivered. Nullable + best-effort: old rows stay null.
alter table public.email_log add column if not exists html text;
