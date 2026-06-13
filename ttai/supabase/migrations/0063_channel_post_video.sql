-- 0063_channel_post_video.sql
-- Allow channel posts (offers) to carry a video — e.g. a supplier sends a video
-- to the TTAI WhatsApp number, or attaches one in the canal composer.

ALTER TABLE channel_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT;
