-- Track photo rejections per user for UX notifications and the 3-strike rule.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_rejection_count   int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_rejection_notification boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_at              timestamptz;

-- Index so the admin queue can quickly surface flagged accounts.
CREATE INDEX IF NOT EXISTS idx_profiles_flagged
  ON profiles (flagged_at)
  WHERE flagged_at IS NOT NULL;
