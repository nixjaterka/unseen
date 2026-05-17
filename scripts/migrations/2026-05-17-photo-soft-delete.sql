-- Soft-delete for photos.
-- Setting deleted_at hides the photo from the user's profile and the swipe
-- deck without destroying the record (kept for dispute resolution / history).
-- The storage file is intentionally NOT removed so it can be reviewed.

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_photos_deleted_at
  ON photos (deleted_at)
  WHERE deleted_at IS NOT NULL;
