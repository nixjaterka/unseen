-- Allow users to hide (soft-delete) archived conversations from their matches list.
-- This is per-user — hiding a conversation only affects the user who hides it.

ALTER TABLE match_preferences
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;
