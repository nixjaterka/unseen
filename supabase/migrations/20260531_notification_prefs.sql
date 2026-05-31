-- Per-user notification preferences stored as individual boolean columns
-- so they're queryable and have clear defaults.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_messages    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_chat_unlock boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_new_match   boolean NOT NULL DEFAULT true;
