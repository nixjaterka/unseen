-- Matches expire 7 days after chat unlocks.
-- expires_at is set explicitly on insert; this migration adds the column
-- and backfills any existing rows.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE matches
SET expires_at = chat_unlock_at + interval '7 days'
WHERE expires_at IS NULL;
