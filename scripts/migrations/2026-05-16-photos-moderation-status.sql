-- Add moderation_status to photos table.
-- Existing rows default to 'approved' so they are unaffected.

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('approved', 'pending', 'rejected'));

-- Index for admin review queue lookups.
CREATE INDEX IF NOT EXISTS idx_photos_moderation_status
  ON photos (moderation_status)
  WHERE moderation_status <> 'approved';
